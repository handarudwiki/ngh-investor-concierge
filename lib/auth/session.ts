// Signed, httpOnly cookies for the prototype's server-side session.
// `ngh_session` holds the signed-in team member; `ngh_visitor` lists the
// leads an anonymous website visitor started, so the public widget can only
// read and write its own conversations. Production swaps the session for
// NGH's identity provider (e.g. Google Workspace SSO).

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION = "ngh_session";
const VISITOR = "ngh_visitor";
const SESSION_DAYS = 7;
const VISITOR_DAYS = 30;
const MAX_VISITOR_LEADS = 20;

let warned = false;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set.");
  if (!warned) {
    console.warn("[auth] SESSION_SECRET is not set — using an insecure development secret.");
    warned = true;
  }
  return "ngh-concierge-dev-only-secret";
}

const mac = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

function seal(data: object, days: number) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + days * 864e5 })).toString("base64url");
  return `${body}.${mac(body)}`;
}

function unseal<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

const options = (days: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: days * 86400,
});

/** Advisor id of the signed-in team member, if the session is valid. */
export async function sessionUserId() {
  return unseal<{ sub: string }>((await cookies()).get(SESSION)?.value)?.sub ?? null;
}

export async function startSession(advisorId: string) {
  (await cookies()).set(SESSION, seal({ sub: advisorId }, SESSION_DAYS), options(SESSION_DAYS));
}

export async function endSession() {
  (await cookies()).delete(SESSION);
}

/** Leads this anonymous visitor started in the widget. */
export async function visitorLeadIds(): Promise<string[]> {
  return unseal<{ leads: string[] }>((await cookies()).get(VISITOR)?.value)?.leads ?? [];
}

export async function rememberVisitorLeads(ids: string[]) {
  if (!ids.length) return;
  const leads = [...new Set([...ids, ...(await visitorLeadIds())])].slice(0, MAX_VISITOR_LEADS);
  (await cookies()).set(VISITOR, seal({ leads }, VISITOR_DAYS), options(VISITOR_DAYS));
}
