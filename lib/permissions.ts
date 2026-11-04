"use client";

// Role-based access (NFR security). Advisors work leads; admins (content owner,
// management) also manage rules, content, templates and compliance actions.
// In the prototype the checks run in the browser; in production the same
// table guards the API and the CRM.

import { useStore } from "./store";
import type { Advisor, State } from "./types";

export type Permission =
  /** Settings: scoring, routing, cost cap, retention, audit log. */
  | "settings"
  /** Edit KB articles, units, prices and scenario assumptions. */
  | "knowledge.edit"
  /** Edit follow-up templates and mark them Meta-approved. */
  | "templates.edit"
  /** Erase a lead's data on request (PDP Law / GDPR). */
  | "lead.delete"
  /** Weekly QA review of concierge answers. */
  | "qa.review";

const ROLE_PERMISSIONS: Record<Advisor["role"], Permission[]> = {
  advisor: [],
  admin: ["settings", "knowledge.edit", "templates.edit", "lead.delete", "qa.review"],
};

export const ROLE_LABEL: Record<Advisor["role"], string> = {
  advisor: "Advisor",
  admin: "Admin",
};

/** Demo-only shared password; production uses NGH's identity provider. */
export const DEMO_PASSWORD = "ngh-demo";

export function currentUser(s: State) {
  return s.advisors.find((a) => a.id === s.me);
}

export function can(user: Advisor | undefined, permission: Permission) {
  return Boolean(user && ROLE_PERMISSIONS[user.role].includes(permission));
}

/** Throws when the signed-in user lacks a permission — the last line behind hidden UI. */
export function assertCan(s: State, permission: Permission) {
  if (!can(currentUser(s), permission)) throw new Error(`Not allowed: ${permission}`);
}

export function useCan(permission: Permission) {
  return useStore((s) => can(currentUser(s), permission));
}
