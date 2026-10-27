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

/**
 * Next weekday Calendly-style slots in the advisors' Bali hours
 * (09:00–17:00 WITA = 01:00–09:00 UTC), at least 2 hours out (FR-11).
 */
export function nextSlots(now: number, count = 6) {
  const out: string[] = [];
  const hoursUtc = [1, 3, 6, 8];
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < 14 * 24 && out.length < count; i++) {
    d.setUTCHours(d.getUTCHours() + 1);
    const weekday = new Date(d.getTime() + 8 * 3600e3).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (!hoursUtc.includes(d.getUTCHours())) continue;
    if (d.getTime() - now < 2 * 3600e3) continue;
    out.push(d.toISOString());
  }
  return out;
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
