// Deterministic conversation policy. Whatever understood the message (Claude
// or the rules fallback), these NGH-approved rules decide scoring, routing,
// escalation, brief generation and booking — the LLM never does.

import type { AssetRef, Lead } from "../types";
import { isQualified, matchUnits, missingFields, nextSlots, routeLead, scoreLead } from "../rules";
import { SCORES } from "../labels";
import { t } from "./i18n";
import { topicOf } from "./understand";
import type { ConciergeContext, TurnResult, Understanding } from "./types";

const ASK_KEY = {
  purpose: "ask_purpose",
  budget: "ask_budget",
  timeline: "ask_timeline",
  ownership: "ask_ownership",
  financing: "ask_financing",
  name: "ask_name",
  email: "ask_email",
} as const;

const DAY = 864e5;

export function decide(
  lead: Lead,
  u: Understanding,
  ctx: ConciergeContext,
  engine: TurnResult["engine"],
  now = Date.now(),
): TurnResult {
  const lang = u.language;
  const lines: string[] = [];
  const events: string[] = [];
  const sources = new Set<string>(u.kbIds);
  const assets: AssetRef[] = [];
  const patch: Partial<Lead> = { language: lang };

  // FR-17: opt-out wins over everything.
  if (u.intents.includes("stop")) {
    return {
      engine,
      language: lang,
      reply: t(lang, "opted_out"),
      sources: [],
      assets: [],
      slots: [],
      patch: { optedOut: true, nextFollowUp: undefined },
      events: ["Lead opted out · all automated messages stopped (FR-17)"],
    };
  }

  // AI disclosure on the first reply of a WhatsApp conversation; the website
  // widget shows it before the first message.
  const firstReply = !lead.messages.some((m) => m.author === "bot");
  if (firstReply && lead.channel === "whatsapp") lines.push(t(lang, "greeting"));

  // Merge captured fields, then re-score with NGH's rules (FR-06, FR-07).
  const merged: Lead = { ...lead, ...u.fields, language: lang };
  Object.assign(patch, u.fields);
  const score = scoreLead(merged, ctx.settings.scoring);
  const qualified = isQualified(merged, ctx.settings.scoring);
  patch.score = score;
  if (qualified && lead.stage === "new") patch.stage = "qualified";
  if (score !== lead.score) events.push(`Scored ${SCORES[score].label} (was ${SCORES[lead.score].label})`);

  // Answer: Claude's grounded text, or the approved KB article(s) verbatim.
  if (u.answer) {
    lines.push(u.answer);
  } else if (!u.kbIds.length && Object.keys(u.fields).length > 0) {
    lines.push(t(lang, "thanks"));
  } else {
    const hits = u.kbIds.map((id) => ctx.kb.find((k) => k.id === id)).filter((k) => k !== undefined);
    const top = hits[0];
    if (top) {
      const body = top.body[lang];
      lines.push(body ?? `${t(lang, "en_note")} ${top.body.en}`);
    }
  }
  if (u.unanswered) {
    if (!u.answer) lines.push(t(lang, "unsure"));
    patch.unanswered = [...(lead.unanswered ?? []), u.unanswered];
    events.push(`Unanswered question logged for the KB team: “${u.unanswered}”`);
  }

  // Routing (FR-12) once there's a reason for an advisor to know this lead.
  let advisorId = lead.advisorId;
  const advisorFor = () => {
    if (!advisorId) {
      const a = routeLead({ ...merged, score }, ctx.advisors, ctx.load);
      if (a) {
        advisorId = a.id;
        patch.advisorId = a.id;
        events.push(`Routed to ${a.name} (language ${lang.toUpperCase()}${score === "hot" ? ", Hot → senior first" : ""})`);
      }
    }
    return ctx.advisors.find((a) => a.id === advisorId);
  };

  // Escalation triggers (FR-13): request, Hot score, legal or pricing negotiation, complaints.
  const escalateKb = u.kbIds.map((id) => ctx.kb.find((k) => k.id === id)).find((k) => k?.escalate);
  let escalation: string | undefined;
  let handoffLine: string | undefined;
  if (u.intents.includes("complaint")) {
    escalation = "Complaint";
    handoffLine = "handoff_complaint";
  } else if (u.intents.includes("negotiation")) {
    escalation = "Price negotiation question";
    handoffLine = "handoff_negotiation";
  } else if (u.intents.includes("human")) {
    escalation = "Asked for a human";
    handoffLine = "handoff_human";
  } else if (escalateKb) {
    escalation = `Legal/tax question: ${topicOf(escalateKb)}`;
    handoffLine = "handoff_legal";
  } else if (score === "hot" && lead.score !== "hot" && ctx.settings.autoHandoffOnHot) {
    escalation = "Hot score — instant handoff";
    handoffLine = "handoff_hot";
  }
  if (escalation) {
    const advisor = advisorFor();
    patch.escalation = escalation;
    lines.push(t(lang, handoffLine as Parameters<typeof t>[1], { advisor: advisor?.name.split(" ")[0] ?? "our team" }));
    events.push(`Escalated to human · reason: ${escalation.toLowerCase()}${advisor ? ` · ${advisor.name} notified` : ""}`);
  }

  // Approved assets on request (FR-04).
  if (u.assets.length) {
    const unit = ctx.units.find((x) => (lead.unitIds[0] ? x.id === lead.unitIds[0] : x.status === "available"));
    const label: Record<AssetRef["kind"], string> = {
      brochure: "Uluwatu Paradise — brochure (PDF)",
      floor_plan: `${unit?.name ?? "Uluwatu Paradise"} — floor plan`,
      photos: "Uluwatu Paradise — photo gallery",
      video: "Site walkthrough — video",
      location: "Uluwatu Paradise, Ungasan — map pin",
    };
    u.assets.forEach((kind) => assets.push({ id: `${kind}-${unit?.id ?? "project"}`, kind, label: label[kind] }));
    if (!lines.length) lines.push(t(lang, "assets"));
  }

  // Personalised brief once qualified (FR-09).
  if (qualified && !lead.briefGeneratedAt) {
    const units = matchUnits(merged, ctx.units);
    patch.briefGeneratedAt = new Date(now).toISOString();
    patch.unitIds = units.map((x) => x.id);
    lines.push(t(lang, "brief_ready"));
    assets.push({ id: "brief", kind: "brochure", label: lang === "en" ? "Your investment brief" : "Investment brief" });
    events.push(`Investment brief generated · ${units.map((x) => x.name).join(", ") || "no matching units"}`);
  }

  // Offer a call when qualified or asked for (FR-11); otherwise qualify further.
  let slots: string[] = [];
  const wantsCall = u.intents.includes("booking");
  if ((qualified || wantsCall) && !lead.booking && !lead.optedOut) {
    const advisor = advisorFor();
    slots = nextSlots(now, 4, lead.timezone, ctx.settings.businessHours);
    lines.push(t(lang, "offer_call", { advisor: advisor?.name ?? "an advisor", tz: lead.timezone }));
  } else if (engine === "rules" && !escalation) {
    const next = missingFields(merged).find((f) => f !== "ownership" && f !== "financing" && f !== "name") ?? missingFields(merged)[0];
    if (next) lines.push(t(lang, ASK_KEY[next]));
  }

  // Every unbooked lead gets a scheduled follow-up (KPI: 100%).
  if (!lead.booking && !lead.nextFollowUp && lead.followUpStep === 0) {
    patch.nextFollowUp = new Date(now + DAY).toISOString();
  }

  patch.topics = [...new Set([...lead.topics, ...u.topics])];
  if (u.objection && !lead.objections.includes(u.objection)) patch.objections = [...lead.objections, u.objection];

  return {
    engine,
    language: lang,
    reply: lines.filter(Boolean).join("\n\n") || t(lang, "unsure"),
    sources: [...sources],
    assets,
    slots,
    patch,
    events,
  };
}
