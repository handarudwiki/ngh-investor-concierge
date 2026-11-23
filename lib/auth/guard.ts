// Server-side role checks for workspace writes (NFR security). Every change
// set from the browser is checked here against the same role table the UI
// uses (lib/roles.ts) before it reaches the database.

import { isDeepStrictEqual } from "node:util";
import { COLLECTIONS, type Changes } from "@/lib/db/changes";
import { advisorFromRow } from "@/lib/db/mapper";
import { prisma } from "@/lib/db/prisma";
import { can, type Permission } from "@/lib/roles";
import type { Advisor } from "@/lib/types";
import { sessionUserId, visitorLeadIds } from "./session";

export type Actor =
  | { kind: "user"; user: Advisor }
  /** Anonymous website or WhatsApp visitor using the concierge widget. */
  | { kind: "visitor"; leadIds: string[] };

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403,
  ) {
    super(message);
  }
}

/** Automated actors whose audit entries a signed-in browser may record. */
const SYSTEM_ACTORS = new Set(["Concierge", "System"]);

export async function currentActor(): Promise<Actor> {
  const id = await sessionUserId();
  if (id) {
    const row = await prisma.advisor.findUnique({ where: { id } });
    if (row) return { kind: "user", user: advisorFromRow(row) };
  }
  return { kind: "visitor", leadIds: await visitorLeadIds() };
}

export function requireUser(actor: Actor, permission?: Permission): Advisor {
  if (actor.kind !== "user") throw new AuthError("Sign in to change the workspace.", 401);
  if (permission && !can(actor.user, permission)) {
    throw new AuthError(`Your role can't do this (needs ${permission}).`, 403);
  }
  return actor.user;
}

const isIdList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Reject payloads that aren't a change set before looking at their contents. */
export function parseChanges(body: unknown): Changes {
  if (!body || typeof body !== "object") throw new AuthError("Malformed change set.", 400);
  const changes = body as Record<string, unknown>;
  for (const key of Object.keys(changes)) {
    if (key === "config") continue;
    if (!COLLECTIONS.includes(key as never)) throw new AuthError(`Unknown collection “${key}”.`, 400);
    const entry = changes[key] as { upsert?: unknown; remove?: unknown } | undefined;
    const upsert = entry?.upsert;
    const valid =
      Array.isArray(upsert) &&
      upsert.every((r) => r && typeof r === "object" && typeof (r as { id?: unknown }).id === "string") &&
      isIdList(entry?.remove);
    if (!valid) throw new AuthError(`Malformed change set for “${key}”.`, 400);
  }
  return changes as Changes;
}

const touched = (changes: Changes, key: (typeof COLLECTIONS)[number]) =>
  Boolean(changes[key]?.upsert.length || changes[key]?.remove.length);

/**
 * Throws AuthError when the actor may not apply these changes. Returns the
 * ids of leads a visitor is creating, so the caller can remember them.
 */
export async function authorize(actor: Actor, changes: Changes): Promise<string[]> {
  if (actor.kind === "visitor") return authorizeVisitor(actor.leadIds, changes);

  const user = actor.user;
  if (touched(changes, "advisors")) requireUser(actor, "settings");
  if (touched(changes, "kb") || touched(changes, "units")) requireUser(actor, "knowledge.edit");
  if (touched(changes, "templates")) requireUser(actor, "templates.edit");
  if (changes.leads?.remove.length) requireUser(actor, "lead.delete");

  if (touched(changes, "qa")) {
    requireUser(actor, "qa.review");
    if (changes.qa!.upsert.some((q) => q.reviewer !== user.name)) {
      throw new AuthError("QA reviews are recorded under your own name.", 403);
    }
  }

  if (changes.audit?.remove.length) throw new AuthError("The audit log can't be edited.", 403);
  if (changes.audit?.upsert.some((a) => a.actor !== user.name && !SYSTEM_ACTORS.has(a.actor))) {
    throw new AuthError("Audit entries are recorded under your own name.", 403);
  }

  if (changes.config) {
    const current = await prisma.appConfig.findUnique({ where: { id: 1 } });
    if (!current || !isDeepStrictEqual(current.settings, changes.config.settings)) requireUser(actor, "settings");
    if (!current || !isDeepStrictEqual(current.assumptions, changes.config.assumptions)) {
      requireUser(actor, "knowledge.edit");
    }
    if (current && current.version !== changes.config.version) requireUser(actor, "settings");
  }
  return [];
}

/** Visitors may start leads and continue their own conversations — nothing else. */
async function authorizeVisitor(own: string[], changes: Changes): Promise<string[]> {
  const other = COLLECTIONS.filter((k) => k !== "leads" && touched(changes, k));
  if (other.length || changes.config || changes.leads?.remove.length) {
    throw new AuthError("Sign in to change the workspace.", 401);
  }
  const ids = (changes.leads?.upsert ?? []).map((l) => l.id).filter((id) => !own.includes(id));
  if (!ids.length) return [];
  const existing = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (existing.length) throw new AuthError("This conversation belongs to someone else.", 403);
  return ids;
}
