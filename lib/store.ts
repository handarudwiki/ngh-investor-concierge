"use client";

// Client-side store over the shared Postgres workspace (/api/state). Pages read
// it synchronously; each mutation updates the UI immediately, then the changed
// records are saved in order. Other tabs refetch on save, and every tab
// refetches on focus and every 15s, so the website widget demo and the advisor
// inbox stay in step — across browsers too. Who is signed in (`me`) comes from
// the server session cookie, and the server re-checks every write against the
// signed-in role (lib/auth/guard.ts).

import { useSyncExternalStore } from "react";
import { diffState, type Changes } from "./db/changes";
import { SEED_NOW, seedState } from "./seed";
import type { State } from "./types";

/** Earlier prototypes kept the workspace, then the signed-in user, here. */
const LEGACY_KEYS = ["ngh-concierge:v1", "ngh-concierge:me"];
const POLL_MS = 15_000;

const seed = seedState(SEED_NOW);
/** Shape-complete placeholder until the workspace loads (and for server render). */
const emptyState: State = {
  ...seed,
  advisors: [],
  leads: [],
  kb: [],
  units: [],
  templates: [],
  audit: [],
  qa: [],
};

export type StoreStatus = "loading" | "ready" | "error";

let state: State = emptyState;
let status: StoreStatus = "loading";
let error = "";
const listeners = new Set<() => void>();

/** Bumped on every local change, so a fetch that started earlier can't overwrite it. */
let generation = 0;
let pendingWrites = 0;
let writeQueue: Promise<void> = Promise.resolve();
let channel: BroadcastChannel | undefined;
let started = false;

function emit() {
  listeners.forEach((l) => l());
}

/** Keep unchanged records' identity so React skips re-rendering them. */
function reuse<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const old = new Map(prev.map((r) => [r.id, r]));
  let same = prev.length === next.length;
  const merged = next.map((r, i) => {
    const before = old.get(r.id);
    const keep = before && JSON.stringify(before) === JSON.stringify(r) ? before : r;
    if (keep !== prev[i]) same = false;
    return keep;
  });
  return same ? prev : merged;
}

function same<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b) ? a : b;
}

function adopt(shared: State) {
  state = {
    version: shared.version,
    me: shared.me,
    advisors: reuse(state.advisors, shared.advisors),
    leads: reuse(state.leads, shared.leads),
    kb: reuse(state.kb, shared.kb),
    units: reuse(state.units, shared.units),
    templates: reuse(state.templates, shared.templates),
    audit: reuse(state.audit, shared.audit),
    qa: reuse(state.qa, shared.qa),
    settings: same(state.settings, shared.settings),
    assumptions: same(state.assumptions, shared.assumptions),
  };
  status = "ready";
  error = "";
  emit();
}

async function readJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

/** Load the shared workspace unless local changes are still being saved. */
export async function refresh() {
  if (pendingWrites > 0) return;
  const gen = generation;
  try {
    const shared: State = await readJson(await fetch("/api/state", { cache: "no-store" }));
    if (gen !== generation || pendingWrites > 0) return;
    adopt(shared);
  } catch (e) {
    if (status === "ready") return; // keep working with what we have; next poll retries
    status = "error";
    error = e instanceof Error ? e.message : String(e);
    emit();
  }
}

function save(changes: Changes) {
  pendingWrites++;
  writeQueue = writeQueue
    .then(async () => {
      await readJson(
        await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }),
      );
      channel?.postMessage("changed");
    })
    .catch((e) => {
      // Includes the server refusing a change the signed-in role can't make.
      console.error("[store] save refused or failed, reloading the workspace:", e);
      generation++;
    })
    .finally(() => {
      pendingWrites--;
      if (pendingWrites === 0) void refresh();
    });
}

function start() {
  if (started) return;
  started = true;
  try {
    LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel("ngh-concierge");
    channel.onmessage = () => void refresh();
  }
  window.addEventListener("focus", () => void refresh());
  setInterval(() => {
    if (document.visibilityState === "visible") void refresh();
  }, POLL_MS);
  void refresh();
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState() {
  return state;
}

export function setState(fn: (s: State) => State) {
  const prev = state;
  const next = fn(prev);
  if (next === prev) return;
  state = next;
  generation++;
  emit();
  const changes = diffState(prev, next);
  if (changes) save(changes);
}

/**
 * Wait for pending saves, run a server request that returns the workspace
 * (or reload it afterwards), adopt it, and tell other tabs.
 */
async function exclusive(request: () => Promise<State | void>) {
  pendingWrites++;
  try {
    await writeQueue;
    const shared = (await request()) ?? ((await readJson(await fetch("/api/state", { cache: "no-store" }))) as State);
    generation++;
    pendingWrites--;
    adopt(shared);
    channel?.postMessage("changed");
  } catch (e) {
    pendingWrites--;
    throw e;
  }
}

/** Reload after the session changed (sign in or out). */
export function reload() {
  return exclusive(async () => {});
}

/** Restore the demo workspace in the database for everyone (admins only). */
export function resetDemo() {
  return exclusive(async () => readJson(await fetch("/api/state/reset", { method: "POST" })));
}

/** Loading state of the shared workspace, for the app-wide gate. */
export function useStoreStatus() {
  return useSyncExternalStore(
    subscribe,
    () => (status === "error" ? `error:${error}` : status),
    () => "loading",
  );
}

/**
 * Subscribe to a slice of state. The selector must return a value already in
 * state (or a primitive) — derive new arrays/objects with useMemo outside it,
 * otherwise React sees a new snapshot on every read.
 */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(emptyState),
  );
}

// --- Clock -----------------------------------------------------------------
// Server render uses the fixed seed time so markup matches during hydration;
// the client then ticks every 30s for relative timestamps.

let now = 0;
const clockListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(l: () => void) {
  clockListeners.add(l);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      clockListeners.forEach((fn) => fn());
    }, 30_000);
  }
  return () => {
    clockListeners.delete(l);
    if (clockListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(
    subscribeClock,
    () => (now ||= Date.now()),
    () => SEED_NOW,
  );
}
