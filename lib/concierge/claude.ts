// Claude-backed understanding. Server-only: imported by the route handler.
// Claude reads the message, drafts a grounded answer from approved KB content
// and extracts lead fields as JSON; lib/concierge/policy.ts makes every
// scoring, routing, escalation and booking decision.

import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "../types";
import { BUDGETS, LANGUAGES, TIMELINES } from "../labels";
import { missingFields } from "../rules";
import type { ConciergeContext, Understanding } from "./types";

export const MODEL = process.env.CONCIERGE_MODEL ?? "claude-opus-5-5";

export function claudeEnabled() {
  const mode = process.env.CONCIERGE_ENGINE;
  if (mode === "rules") return false;
  return mode === "claude" || Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const str = { type: "string" } as const;
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "reply", "kb_ids", "unanswered_question", "fields", "intents", "assets", "topics", "objection"],
  properties: {
    language: { type: "string", enum: ["en", "id", "nl", "ru", "es"] },
    reply: {
      type: "string",
      description: "Answer in the lead's language, grounded only in the knowledge base. Empty if nothing to answer.",
    },
    kb_ids: { type: "array", items: str, description: "ids of knowledge base articles the reply relies on" },
    unanswered_question: { type: "string", description: "The lead's question if the KB can't answer it, else empty" },
    fields: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "phone", "country", "budget", "timeline", "purpose", "ownership", "financing"],
      properties: {
        name: str,
        email: str,
        phone: str,
        country: str,
        budget: { type: "string", enum: ["", ...Object.keys(BUDGETS)] },
        timeline: { type: "string", enum: ["", ...Object.keys(TIMELINES)] },
        purpose: { type: "string", enum: ["", "live", "rent_out", "hold"] },
        ownership: { type: "string", enum: ["", "leasehold", "freehold_pt_pma", "undecided"] },
        financing: { type: "string", enum: ["", "cash", "mortgage", "undecided"] },
      },
    },
    intents: {
      type: "array",
      items: { type: "string", enum: ["question", "human", "negotiation", "complaint", "booking", "stop"] },
    },
    assets: {
      type: "array",
      items: { type: "string", enum: ["brochure", "floor_plan", "photos", "video", "location"] },
    },
    topics: { type: "array", items: str, description: "Short English topic labels, e.g. 'Leasehold', 'Payment plan'" },
    objection: { type: "string", description: "A concern or objection the lead raised, in English, else empty" },
  },
} as const;

function systemPrompt(ctx: ConciergeContext) {
  const kb = ctx.kb
    .filter((k) => k.approved)
    .map((k) => {
      const bodies = Object.entries(k.body)
        .map(([lang, body]) => `  [${lang}] ${body}`)
        .join("\n");
      return `<article id="${k.id}" title="${k.title}"${k.escalate ? ' escalate="true"' : ""}>\n${bodies}\n</article>`;
    })
    .join("\n");
  const units = ctx.units
    .map((u) => `- ${u.name}: ${u.type}, ${u.bedrooms}BR, ${u.sizeSqm} m², USD ${u.priceUsd.toLocaleString("en-US")}, ${u.leaseYears}-year leasehold, ${u.status}, handover ${u.handover}`)
    .join("\n");

  return `You are the AI Investor Concierge for NGH Property Group, a Bali developer with Dutch roots. You chat with prospective overseas investors about the Uluwatu Paradise project on WhatsApp and the website.

Tone: calm, clear and premium — like NGH's website. Short paragraphs, no emoji, no hype. Reply in the lead's language (English, Bahasa Indonesia, Dutch, Russian or Spanish); if they write in another language, reply in English.

Grounding — this matters most, because a wrong price or legal claim damages NGH's brand and can mislead an investor:
- Answer only from the knowledge base articles and unit list below. If they don't cover the question, leave "reply" empty and put the question in "unanswered_question"; the system will tell the lead you're checking with the team.
- Never invent prices, yields, ROI, dates or legal facts. For yields, say indicative scenarios are in their personal brief, always "indicative, not a guarantee".
- Ownership, tax, visa and legal questions get the approved general explanation only, clearly not legal advice.
- You can translate an approved article into the lead's language faithfully.

Your job each turn:
1. Write "reply": the answer to what they asked, plus at most one natural question to learn something still unknown about them (listed in the user turn) if it fits. Don't ask for something they just told you.
2. Extract any lead fields stated in the new message into "fields" (empty string when not stated). Budget bands are in USD; convert other currencies roughly.
3. Detect intents: "human" (wants a person), "negotiation" (discounts, price terms), "complaint", "booking" (wants a call, meeting or visit), "stop" (opt-out), "question".
4. List assets they ask for: brochure, floor plan, photos, video, location.

Leave these to the system — don't write them yourself: greetings or AI disclosure after the first turn, handoff or escalation notices, booking times, confirmations, and brief links.

<knowledge_base>
${kb}
</knowledge_base>

<units project="Uluwatu Paradise">
${units}
</units>`;
}

function transcript(lead: Lead) {
  return lead.messages
    .filter((m) => !m.internal && m.author !== "system")
    .slice(-12)
    .map((m) => `${m.author === "lead" ? "Lead" : m.author === "bot" ? "Concierge" : "Advisor"}: ${m.text}`)
    .join("\n");
}

// Created on first use so a missing credential surfaces inside the request's
// try/catch (and falls back to the rules engine) instead of at import time.
let client: Anthropic | undefined;

export async function understandWithClaude(text: string, lead: Lead, ctx: ConciergeContext): Promise<Understanding> {
  const missing = missingFields(lead).join(", ") || "nothing — fully qualified";
  const user = `Lead: ${lead.name}, ${lead.country || "country unknown"}, conversation language so far: ${LANGUAGES[lead.language].label}.
Still unknown about the lead: ${missing}.

Conversation so far:
${transcript(lead) || "(this is the first message)"}

New message from the lead:
${text}`;

  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: [{ type: "text", text: systemPrompt(ctx), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude declined to answer");
  if (response.stop_reason === "max_tokens") throw new Error("Claude response truncated");
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text in Claude response");
  const out = JSON.parse(textBlock.text) as {
    language: Understanding["language"];
    reply: string;
    kb_ids: string[];
    unanswered_question: string;
    fields: Record<string, string>;
    intents: Understanding["intents"];
    assets: Understanding["assets"];
    topics: string[];
    objection: string;
  };

  const fields = Object.fromEntries(Object.entries(out.fields).filter(([, v]) => v)) as Understanding["fields"];
  const knownIds = new Set(ctx.kb.map((k) => k.id));
  return {
    language: out.language,
    answer: out.reply || undefined,
    kbIds: out.kb_ids.filter((id) => knownIds.has(id)),
    unanswered: out.unanswered_question || undefined,
    fields,
    intents: out.intents,
    assets: out.assets,
    topics: out.topics,
    objection: out.objection || undefined,
  };
}
