"use client";

// Client-side store over the shared Postgres workspace (/api/state). Pages read
// it synchronously; each mutation updates the UI immediately, then the changed
// records are saved in order. Other tabs refetch on save, and every tab
// refetches on focus and every 15s, so the website widget demo and the advisor
// inbox stay in step — across browsers too. Who is signed in (`me`) stays per
// browser in localStorage.

import { useSyncExternalStore } from "react";
import { diffState, type Changes, type SharedState } from "./db/changes";
import { SEED_NOW, seedState } from "./seed";
import type { State } from "./types";

const ME_KEY = "ngh-concierge:me";
/** The pre-database prototype kept the whole workspace here. */
const LEGACY_KEY = "ngh-concierge:v1";
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

function readMe() {
  try {
    return window.localStorage.getItem(ME_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeMe(id: string) {
  try {
    if (id) window.localStorage.setItem(ME_KEY, id);
    else window.localStorage.removeItem(ME_KEY);
  } catch {
    // Storage blocked — sign-in lasts for this tab only.
  }
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

function adopt(shared: SharedState) {
  const me = readMe();
  state = {
    version: shared.version,
    me: shared.advisors.some((a) => a.id === me) ? me : "",
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
    const shared: SharedState = await readJson(await fetch("/api/state", { cache: "no-store" }));
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
      console.error("[store] save failed, reloading the workspace:", e);
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
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {}
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel("ngh-concierge");
    channel.onmessage = () => void refresh();
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== ME_KEY || status !== "ready") return;
    const me = readMe();
    state = { ...state, me: state.advisors.some((a) => a.id === me) ? me : "" };
    emit();
  });
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
  if (next.me !== prev.me) writeMe(next.me);
  emit();
  const changes = diffState(prev, next);
  if (changes) save(changes);
}

/** Restore the demo workspace in the database for everyone. */
export async function resetDemo() {
  pendingWrites++;
  try {
    await writeQueue;
    const shared: SharedState = await readJson(await fetch("/api/state/reset", { method: "POST" }));
    generation++;
    pendingWrites--;
    adopt(shared);
    channel?.postMessage("changed");
  } catch (e) {
    pendingWrites--;
    throw e;
  }
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
