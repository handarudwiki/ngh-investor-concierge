import { loadState, reseed } from "@/lib/db/repo";

/** Settings → Data & compliance → reset: restore the demo workspace. */
export async function POST() {
  try {
    await reseed(Date.now());
    return Response.json(await loadState());
  } catch (error) {
    console.error("[state] reset failed:", error);
    return Response.json({ error: "Could not reset the demo data" }, { status: 500 });
  }
}
