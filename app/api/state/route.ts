import { connection } from "next/server";
import type { Changes } from "@/lib/db/changes";
import { applyChanges, EmptyDatabaseError, loadState } from "@/lib/db/repo";

/**
 * Shared workspace state backed by Postgres (in place of the CRM for the
 * prototype). GET loads everything; POST applies the records one browser
 * changed. Role checks still run in the browser — production guards this API
 * with a server-side session (BRD NFR security).
 */
export async function GET() {
  await connection();
  try {
    return Response.json(await loadState());
  } catch (error) {
    if (error instanceof EmptyDatabaseError) return Response.json({ error: error.message }, { status: 503 });
    console.error("[state] load failed:", error);
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const changes = (await request.json()) as Changes;
  try {
    await applyChanges(changes);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[state] write failed:", error);
    return Response.json({ error: "Could not save changes" }, { status: 500 });
  }
}
