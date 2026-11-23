// Wire format between the browser store and /api/state. The store diffs each
// mutation by reference and sends only the records that changed.

import type { Advisor, AuditEntry, KbArticle, Lead, QaReview, State, Template, Unit } from "@/lib/types";

export interface Collections {
  advisors: Advisor;
  leads: Lead;
  kb: KbArticle;
  units: Unit;
  templates: Template;
  audit: AuditEntry;
  qa: QaReview;
}

export type CollectionKey = keyof Collections;

export const COLLECTIONS: CollectionKey[] = ["advisors", "leads", "kb", "units", "templates", "audit", "qa"];

export type Changes = {
  [K in CollectionKey]?: { upsert: Collections[K][]; remove: string[] };
} & {
  config?: Pick<State, "version" | "settings" | "assumptions">;
};

/** Everything shared across the team. `me` is per browser and never stored. */
export type SharedState = Omit<State, "me">;

/** Records in `next` that are new or replaced, and ids that disappeared. */
export function diffState(prev: State, next: State): Changes | undefined {
  const changes: Changes = {};
  let any = false;
  for (const key of COLLECTIONS) {
    const before = prev[key] as { id: string }[];
    const after = next[key] as { id: string }[];
    if (before === after) continue;
    const old = new Map(before.map((r) => [r.id, r]));
    const ids = new Set(after.map((r) => r.id));
    const upsert = after.filter((r) => old.get(r.id) !== r);
    const remove = before.filter((r) => !ids.has(r.id)).map((r) => r.id);
    if (!upsert.length && !remove.length) continue;
    (changes as Record<string, unknown>)[key] = { upsert, remove };
    any = true;
  }
  if (prev.settings !== next.settings || prev.assumptions !== next.assumptions || prev.version !== next.version) {
    changes.config = { version: next.version, settings: next.settings, assumptions: next.assumptions };
    any = true;
  }
  return any ? changes : undefined;
}
