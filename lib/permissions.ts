"use client";

// Browser side of role-based access: who is signed in and what the UI shows.
// The role table lives in ./roles, shared with the API guard.

import { useStore } from "./store";
import { can, type Permission } from "./roles";
import type { State } from "./types";

export { can, DEMO_PASSWORD, ROLE_LABEL, type Permission } from "./roles";

export function currentUser(s: State) {
  return s.advisors.find((a) => a.id === s.me);
}

/** Throws when the signed-in user lacks a permission — the last line behind hidden UI. */
export function assertCan(s: State, permission: Permission) {
  if (!can(currentUser(s), permission)) throw new Error(`Not allowed: ${permission}`);
}

export function useCan(permission: Permission) {
  return useStore((s) => can(currentUser(s), permission));
}
