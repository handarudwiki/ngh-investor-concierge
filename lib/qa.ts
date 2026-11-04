// Weekly QA review (NFR accuracy: "weekly QA sample of 50 conversations") and
// the BRD KPI "answers flagged wrong in weekly QA review: under 2%".

import type { Lead, Message, QaIssue, State } from "./types";

export const QA_SAMPLE_SIZE = 50;
export const QA_TARGET_PCT = 2;

export const QA_ISSUES: Record<QaIssue, string> = {
  wrong_fact: "Wrong or invented fact",
  should_escalate: "Should have handed off",
  off_brand: "Off-brand tone",
  wrong_language: "Wrong language",
  other: "Other",
};

const WEEK = 7 * 864e5;

/** Small stable hash so the same week always samples the same conversations. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface QaAnswer {
  lead: Lead;
  message: Message;
  /** The lead message this answer replied to, for context. */
  question?: Message;
}

/**
 * Concierge answers in the period: bot messages that replied to the lead.
 * Template sends (follow-ups, reminders) are approved copy, so they're skipped.
 */
export function answersOf(lead: Lead, templateIds: Set<string>, from: number, to: number): QaAnswer[] {
  const out: QaAnswer[] = [];
  let question: Message | undefined;
  for (const m of lead.messages) {
    if (m.author === "lead") question = m;
    if (m.author !== "bot") continue;
    if (m.sources?.some((id) => templateIds.has(id))) continue;
    const t = Date.parse(m.at);
    if (t >= from && t < to) out.push({ lead, message: m, question });
  }
  return out;
}

/** This period's QA sample and its results. */
export function qaSample(s: State, to: number, from = to - WEEK) {
  const templateIds = new Set(s.templates.map((t) => t.id));
  const weekKey = Math.floor(to / WEEK);
  const conversations = s.leads
    .map((lead) => ({ lead, answers: answersOf(lead, templateIds, from, to) }))
    .filter((c) => c.answers.length > 0)
    .sort((a, b) => hash(a.lead.id + weekKey) - hash(b.lead.id + weekKey))
    .slice(0, QA_SAMPLE_SIZE)
    .sort((a, b) => Date.parse(b.lead.lastMessageAt) - Date.parse(a.lead.lastMessageAt));

  const reviewById = new Map(s.qa.map((r) => [r.messageId, r]));
  const answers = conversations.flatMap((c) => c.answers);
  const reviewed = answers.filter((a) => reviewById.has(a.message.id));
  const wrong = reviewed.filter((a) => reviewById.get(a.message.id)!.verdict === "wrong");
  const done = conversations.filter((c) => c.answers.every((a) => reviewById.has(a.message.id)));

  return {
    conversations,
    reviewById,
    answers: answers.length,
    reviewed: reviewed.length,
    wrong: wrong.length,
    /** Share of reviewed answers flagged wrong; undefined until something is reviewed. */
    wrongPct: reviewed.length ? (wrong.length / reviewed.length) * 100 : undefined,
    conversationsDone: done.length,
  };
}
