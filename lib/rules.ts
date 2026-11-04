// Business rules NGH approves in discovery: scoring (FR-07), routing (FR-12)
// and indicative scenarios (FR-09/10). Pure functions — shared by the
// dashboard and the concierge engine.

import type { Advisor, Assumptions, Lead, ScoringRules, Score, Unit } from "./types";

export function scorePoints(lead: Partial<Lead>, rules: ScoringRules) {
  let points = 0;
  if (lead.budget) points += rules.budget[lead.budget];
  if (lead.timeline) points += rules.timeline[lead.timeline];
  if (lead.financing === "cash") points += rules.cashBuyer;
  if (lead.email || lead.phone) points += rules.contactShared;
  if (lead.purpose) points += rules.purposeKnown;
  return points;
}

export function scoreLead(lead: Partial<Lead>, rules: ScoringRules): Score {
  const p = scorePoints(lead, rules);
  if (p >= rules.hotAt) return "hot";
  if (p >= rules.warmAt) return "warm";
  return "cold";
}

/** Qualified = the essentials are captured and the lead isn't cold. */
export function isQualified(lead: Partial<Lead>, rules: ScoringRules) {
  return Boolean(lead.budget && lead.timeline && lead.purpose) && scoreLead(lead, rules) !== "cold";
}

/** Fields the concierge still needs to ask for, in asking order (FR-06). */
export function missingFields(lead: Partial<Lead>) {
  const order = ["purpose", "budget", "timeline", "ownership", "financing", "name", "email"] as const;
  return order.filter((f) => {
    if (f === "name") return !lead.name || lead.name.startsWith("Website visitor");
    return !lead[f];
  });
}

/**
 * Route by language, then project, then score: Hot leads go to a senior
 * advisor when one speaks the language; ties broken by fewest open leads.
 */
export function routeLead(
  lead: Pick<Lead, "language" | "project" | "score">,
  advisors: Advisor[],
  load: Record<string, number>,
) {
  const open = (id: string) => load[id] ?? 0;
  const byLang = advisors.filter((a) => a.role === "advisor" && a.languages.includes(lead.language));
  const pool = byLang.length ? byLang : advisors.filter((a) => a.role === "advisor" && a.languages.includes("en"));
  const byProject = pool.filter((a) => a.projects.includes(lead.project));
  const candidates = byProject.length ? byProject : pool;
  const preferred = lead.score === "hot" ? candidates.filter((a) => a.senior) : [];
  const final = preferred.length ? preferred : candidates;
  return [...final].sort((a, b) => open(a.id) - open(b.id))[0];
}

/** Open leads per advisor, the input routeLead balances on. */
export function advisorLoad(leads: Lead[]) {
  const load: Record<string, number> = {};
  for (const l of leads) {
    if (l.advisorId && l.stage !== "won" && l.stage !== "lost") load[l.advisorId] = (load[l.advisorId] ?? 0) + 1;
  }
  return load;
}

/** Hours (local, 24h) we offer a call to a lead: no calls before 08:00 or starting after 20:00. */
const LEAD_HOURS = { start: 8, end: 21 };

function localHour(at: number, timeZone: string) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(at));
}

/**
 * Next weekday Calendly-style slots, on the hour inside the advisors' Bali
 * business hours (WITA, UTC+8) and at least 2 hours out (FR-11). With the
 * lead's time zone, only slots that also fall in the lead's waking hours are
 * offered; if none overlap in the next two weeks, every advisor slot is.
 */
export function nextSlots(
  now: number,
  count = 6,
  leadTimezone?: string,
  hours: { start: number; end: number } = { start: 9, end: 18 },
) {
  const advisorSlots: number[] = [];
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < 14 * 24; i++) {
    d.setUTCHours(d.getUTCHours() + 1);
    const bali = new Date(d.getTime() + 8 * 3600e3);
    const weekday = bali.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    // Last slot starts an hour before close.
    if (bali.getUTCHours() < hours.start || bali.getUTCHours() >= hours.end) continue;
    if (d.getTime() - now < 2 * 3600e3) continue;
    advisorSlots.push(d.getTime());
  }
  const suitable = leadTimezone
    ? advisorSlots.filter((t) => {
        const h = localHour(t, leadTimezone);
        return h >= LEAD_HOURS.start && h < LEAD_HOURS.end;
      })
    : advisorSlots;
  return (suitable.length ? suitable : advisorSlots).slice(0, count).map((t) => new Date(t).toISOString());
}

export interface Scenario {
  key: "conservative" | "base" | "optimistic";
  label: string;
  occupancy: number;
  grossRevenue: number;
  netRevenue: number;
  netYieldPct: number;
}

/**
 * Indicative rental scenarios from NGH's own assumptions (FR-09). Callers must
 * always render the assumptions and the "indicative, not a guarantee" label
 * alongside these numbers (FR-10).
 */
export function scenarios(unit: Unit, a: Assumptions): Scenario[] {
  const keys = [
    ["conservative", "Conservative"],
    ["base", "Base"],
    ["optimistic", "Optimistic"],
  ] as const;
  return keys.map(([key, label]) => {
    const occupancy = a.occupancy[key];
    const gross = unit.adrUsd * 365 * (occupancy / 100);
    const net = gross * (1 - a.managementFeePct / 100 - a.operatingCostPct / 100);
    return {
      key,
      label,
      occupancy,
      grossRevenue: gross,
      netRevenue: net,
      netYieldPct: (net / unit.priceUsd) * 100,
    };
  });
}

const budgetMax: Record<string, number> = {
  "<250k": 250_000,
  "250-500k": 500_000,
  "500k-1m": 1_000_000,
  "1m+": Infinity,
};
const budgetMin: Record<string, number> = {
  "<250k": 0,
  "250-500k": 250_000,
  "500k-1m": 500_000,
  "1m+": 1_000_000,
};

/** Available units inside the lead's budget band, best fit first. */
export function matchUnits(lead: Pick<Lead, "budget" | "purpose" | "project">, units: Unit[]) {
  const avail = units.filter((u) => u.status === "available" && u.project === lead.project);
  if (!lead.budget) return avail.slice(0, 2);
  const max = budgetMax[lead.budget] * 1.1;
  const min = budgetMin[lead.budget] * 0.8;
  const fit = avail.filter((u) => u.priceUsd <= max && u.priceUsd >= min);
  const list = fit.length ? fit : avail.filter((u) => u.priceUsd <= max);
  return list.sort((a, b) => b.priceUsd - a.priceUsd).slice(0, 2);
}
