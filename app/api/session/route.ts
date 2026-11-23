import { randomUUID } from "node:crypto";
import { endSession, sessionUserId, startSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DEMO_PASSWORD } from "@/lib/roles";

/**
 * Prototype sign-in against the team list with the shared demo password.
 * Production uses NGH's identity provider (e.g. Google Workspace SSO).
 */
export async function POST(request: Request) {
  const { email, password } = ((await request.json().catch(() => ({}))) ?? {}) as { email?: unknown; password?: unknown };
  const user =
    typeof email === "string"
      ? await prisma.advisor.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } })
      : null;
  if (!user || password !== DEMO_PASSWORD) {
    return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  await startSession(user.id);
  await audit(user.name, "Signed in");
  return Response.json({ id: user.id });
}

export async function DELETE() {
  const id = await sessionUserId();
  const user = id ? await prisma.advisor.findUnique({ where: { id } }) : null;
  await endSession();
  if (user) await audit(user.name, "Signed out");
  return Response.json({ ok: true });
}

function audit(actor: string, action: string) {
  return prisma.auditEntry.create({ data: { id: `au${randomUUID().slice(0, 8)}`, at: new Date(), actor, action } });
}
