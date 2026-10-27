"use client";

// Client-side demo store. In production this is the CRM (BRD: "Use NGH's CRM
// if one exists; otherwise HubSpot free tier or a simple custom pipeline").
// State persists to localStorage and syncs across tabs, so the website widget
// demo and the advisor inbox update each other live.

import { useSyncExternalStore } from "react";
import { SEED_NOW, seedState } from "./seed";
import type { State } from "./types";

const KEY = "ngh-concierge:v1";
const serverState = seedState(SEED_NOW);
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === serverState.version) return parsed;
    }
  } catch {
    // Private mode or corrupted entry — fall back to fresh demo data.
  }
  return seedState(Date.now());
}

function persist(s: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked; the in-memory state still works.
  }
}

function getSnapshot(): State {
  if (!state) state = load();
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    state = load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getState() {
  return getSnapshot();
}

export function setState(fn: (s: State) => State) {
  state = fn(getSnapshot());
  persist(state);
  emit();
}

export function resetDemo() {
  state = seedState(Date.now());
  persist(state);
  emit();
}

/**
 * Subscribe to a slice of state. The selector must return a value already in
 * state (or a primitive) — derive new arrays/objects with useMemo outside it,
 * otherwise React sees a new snapshot on every read.
 */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(serverState),
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
