import { connection } from "next/server";
import { claudeEnabled, understandWithClaude } from "@/lib/concierge/claude";
import { decide } from "@/lib/concierge/policy";
import { understandWithRules } from "@/lib/concierge/understand";
import type { TurnRequest, TurnResult } from "@/lib/concierge/types";

/**
 * One concierge turn: understand the lead's message (Claude when configured,
 * otherwise the rules engine), then apply NGH's deterministic policy.
 * If Claude fails, the rules engine answers and an advisor is alerted (NFR:
 * availability fallback).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as TurnRequest;
  const { lead, text, context } = body;
  if (!text?.trim() || !lead || !context) {
    return Response.json({ error: "lead, text and context are required" }, { status: 400 });
  }

  let result: TurnResult;
  if (claudeEnabled()) {
    try {
      const u = await understandWithClaude(text, lead, context);
      result = decide(lead, u, context, "claude");
    } catch (error) {
      console.error("[concierge] Claude unavailable, falling back to rules:", error);
      result = decide(lead, understandWithRules(text, lead, context.kb), context, "rules");
      result.events.push("AI service unavailable — answered by the rules fallback · advisor alerted");
      result.patch.escalation ??= "AI service unavailable";
    }
  } else {
    result = decide(lead, understandWithRules(text, lead, context.kb), context, "rules");
  }

  return Response.json(result);
}

/** Which engine is live — read at request time so env changes apply without a rebuild. */
export async function GET() {
  await connection();
  return Response.json({ engine: claudeEnabled() ? "claude" : "rules" });
}
