import { connection } from "next/server";
import { authorize, AuthError, currentActor, parseChanges } from "@/lib/auth/guard";
import { rememberVisitorLeads } from "@/lib/auth/session";
import { applyChanges, EmptyDatabaseError, loadState } from "@/lib/db/repo";
import type { State } from "@/lib/types";

/**
 * Shared workspace state backed by Postgres (in place of the CRM for the
 * prototype). GET loads what the caller may see; POST applies the records one
 * browser changed, after the server-side role checks in lib/auth/guard.ts.
 */
export async function GET() {
  await connection();
  try {
    const [actor, shared] = await Promise.all([currentActor(), loadState()]);
    const state: State =
      actor.kind === "user"
        ? { ...shared, me: actor.user.id }
        : // Visitors see the public content plus their own conversations only.
          { ...shared, me: "", leads: shared.leads.filter((l) => actor.leadIds.includes(l.id)), audit: [], qa: [] };
    return Response.json(state);
  } catch (error) {
    if (error instanceof EmptyDatabaseError) return Response.json({ error: error.message }, { status: 503 });
    console.error("[state] load failed:", error);
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const changes = parseChanges(await request.json().catch(() => null));
    const actor = await currentActor();
    const startedLeads = await authorize(actor, changes);
    await applyChanges(changes);
    await rememberVisitorLeads(startedLeads);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[state] write failed:", error);
    return Response.json({ error: "Could not save changes" }, { status: 500 });
  }
}
