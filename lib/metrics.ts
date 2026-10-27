// KPI calculations for the BRD's "Objectives and success metrics" table.

import { isQualified } from "./rules";
import { isAfterHours } from "./format";
import type { Lead, State } from "./types";

export function firstResponseMs(lead: Lead) {
  const first = lead.messages.find((m) => m.author === "lead");
  if (!first) return undefined;
  const reply = lead.messages.find(
    (m) => (m.author === "bot" || m.author === "advisor") && !m.internal && Date.parse(m.at) >= Date.parse(first.at),
  );
  return reply ? Date.parse(reply.at) - Date.parse(first.at) : undefined;
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const isOpen = (l: Lead) => l.stage !== "won" && l.stage !== "lost";
const humanTouched = (l: Lead) => l.mode === "human" || l.messages.some((m) => m.author === "advisor");

export function computeKpis(s: State, from = 0, to = Infinity) {
  const inRange = s.leads.filter((l) => {
    const t = Date.parse(l.createdAt);
    return t >= from && t < to;
  });
  const responses = inRange.map(firstResponseMs).filter((x): x is number => x !== undefined);
  const booked = inRange.filter((l) => l.booking);
  const qualifiedBooked = booked.filter((l) => isQualified(l, s.settings.scoring));
  const open = inRange.filter((l) => isOpen(l) && !l.optedOut);
  const withFollowUp = open.filter((l) => l.nextFollowUp || l.booking || l.mode === "human");
  const attributed = inRange.filter((l) => l.source !== "direct" || l.sourceDetail);
  const firstMsgs = inRange
    .map((l) => l.messages.find((m) => m.author === "lead"))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const ratio = (a: number, b: number) => (b ? (a / b) * 100 : 0);

  return {
    leads: inRange.length,
    medianFirstResponseMs: median(responses),
    resolvedWithoutHumanPct: ratio(inRange.filter((l) => !humanTouched(l) && !l.escalation).length, inRange.length),
    qualifiedBookedPct: ratio(qualifiedBooked.length, booked.length),
    qualifiedPct: ratio(inRange.filter((l) => isQualified(l, s.settings.scoring)).length, inRange.length),
    callsBooked: booked.length,
    followUpCoveragePct: ratio(withFollowUp.length, open.length),
    attributionPct: ratio(attributed.length, inRange.length),
    afterHoursPct: ratio(firstMsgs.filter((m) => isAfterHours(m.at)).length, firstMsgs.length),
    hot: inRange.filter((l) => l.score === "hot").length,
    escalations: inRange.filter((l) => l.escalation || l.messages.some((m) => m.text.startsWith("Escalated"))).length,
  };
}

export type Kpis = ReturnType<typeof computeKpis>;

/** Topics asked across leads, for "top questions" in the weekly report. */
export function topTopics(leads: Lead[], limit = 6) {
  const counts = new Map<string, number>();
  leads.forEach((l) => l.topics.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
