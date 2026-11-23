// Role-based access (NFR security). Advisors work leads; admins (content owner,
// management) also manage rules, content, templates and compliance actions.
// One table for both sides: the browser hides what a role can't do, and the
// API (lib/auth/guard.ts) refuses it.

import type { Advisor } from "./types";

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

export function can(user: Pick<Advisor, "role"> | undefined | null, permission: Permission) {
  return Boolean(user && ROLE_PERMISSIONS[user.role].includes(permission));
}
