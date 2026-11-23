import { AuthError, currentActor, requireUser } from "@/lib/auth/guard";
import { loadState, reseed } from "@/lib/db/repo";

/** Settings → Data & compliance → reset: restore the demo workspace (admins only). */
export async function POST() {
  try {
    const user = requireUser(await currentActor(), "settings");
    await reseed(Date.now());
    // The demo team is reseeded with the same ids, so the session stays valid.
    return Response.json({ ...(await loadState()), me: user.id });
  } catch (error) {
    if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[state] reset failed:", error);
    return Response.json({ error: "Could not reset the demo data" }, { status: 500 });
  }
}
