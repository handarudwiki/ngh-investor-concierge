"use client";

// Mutations on the demo store. Each one mirrors an advisor action or an
// automation from the BRD and writes an audit entry where the NFRs ask for one.

import { getState, setState } from "./store";
import { isQualified, matchUnits, routeLead, scoreLead } from "./rules";
import { stageLabel } from "./labels";
import type {
  AuditEntry,
  Lead,
  Message,
  Settings,
  Stage,
  State,
  Template,
  TemplateKind,
  KbArticle,
  Unit,
  Assumptions,
} from "./types";

export const uid = (p = "") => `${p}${crypto.randomUUID().slice(0, 8)}`;
const nowIso = () => new Date().toISOString();

function me(s: State) {
  return s.advisors.find((a) => a.id === s.me)!;
}

function audit(s: State, action: string, leadId?: string, actor?: string): AuditEntry[] {
  return [{ id: uid("au"), at: nowIso(), actor: actor ?? me(s).name, action, leadId }, ...s.audit];
}

function patchLead(s: State, id: string, fn: (l: Lead) => Lead): State {
  return { ...s, leads: s.leads.map((l) => (l.id === id ? fn(l) : l)) };
}

function msg(author: Message["author"], text: string, extra?: Partial<Message>): Message {
  return { id: uid("m"), author, text, at: nowIso(), ...extra };
}

export function markRead(leadId: string) {
  const lead = getState().leads.find((l) => l.id === leadId);
  if (!lead || lead.unread === 0) return;
  setState((s) => patchLead(s, leadId, (l) => ({ ...l, unread: 0 })));
}

export function toggleStar(leadId: string) {
  setState((s) => patchLead(s, leadId, (l) => ({ ...l, starred: !l.starred })));
}

export function sendAdvisorMessage(leadId: string, text: string, internal = false) {
  setState((s) => {
    const advisor = me(s);
    return patchLead(s, leadId, (l) => ({
      ...l,
      lastMessageAt: nowIso(),
      messages: [...l.messages, msg("advisor", text, { advisorId: advisor.id, internal })],
    }));
  });
}

/** FR-13 / FR-17: a human takes over; bot replies and automations stop. */
export function takeOver(leadId: string) {
  setState((s) => {
    const advisor = me(s);
    const next = patchLead(s, leadId, (l) => ({
      ...l,
      mode: "human",
      escalation: undefined,
      advisorId: l.advisorId ?? advisor.id,
      nextFollowUp: undefined,
      messages: [...l.messages, msg("system", `${advisor.name} took over the conversation · automations paused`)],
    }));
    return { ...next, audit: audit(s, "Took over conversation", leadId) };
  });
}

export function handBack(leadId: string) {
  setState((s) => {
    const next = patchLead(s, leadId, (l) => ({
      ...l,
      mode: "bot",
      messages: [...l.messages, msg("system", `${me(s).name} handed the conversation back to the concierge`)],
    }));
    return { ...next, audit: audit(s, "Handed back to concierge", leadId) };
  });
}

export function setStage(leadId: string, stage: Stage, lostReason?: string) {
  setState((s) => {
    const next = patchLead(s, leadId, (l) => ({
      ...l,
      stage,
      lostReason: stage === "lost" ? lostReason ?? l.lostReason : undefined,
      nextFollowUp: stage === "won" || stage === "lost" ? undefined : l.nextFollowUp,
      messages: [...l.messages, msg("system", `Stage changed to ${stageLabel(stage)} by ${me(s).name}`)],
    }));
    return { ...next, audit: audit(s, `Moved to ${stageLabel(stage)}`, leadId) };
  });
}

export function assignAdvisor(leadId: string, advisorId: string) {
  setState((s) => {
    const name = s.advisors.find((a) => a.id === advisorId)?.name ?? "—";
    const next = patchLead(s, leadId, (l) => ({ ...l, advisorId }));
    return { ...next, audit: audit(s, `Assigned to ${name}`, leadId) };
  });
}

/** Edit profile fields; score and stage recalculated from the approved rules. */
export function updateLead(leadId: string, patch: Partial<Lead>) {
  setState((s) =>
    patchLead(s, leadId, (l) => {
      const merged = { ...l, ...patch };
      const score = scoreLead(merged, s.settings.scoring);
      const stage = merged.stage === "new" && isQualified(merged, s.settings.scoring) ? "qualified" : merged.stage;
      return { ...merged, score, stage };
    }),
  );
}

/** FR-17: opt-out stops every automated message. */
export function optOut(leadId: string) {
  setState((s) => {
    const next = patchLead(s, leadId, (l) => ({
      ...l,
      optedOut: true,
      nextFollowUp: undefined,
      messages: [...l.messages, msg("system", "Lead opted out · all automated messages stopped")],
    }));
    return { ...next, audit: audit(s, "Marked opted out", leadId) };
  });
}

/** PDP Law / GDPR: erase on request. */
export function deleteLead(leadId: string) {
  setState((s) => ({
    ...s,
    leads: s.leads.filter((l) => l.id !== leadId),
    audit: audit(s, "Deleted lead data on request", leadId),
  }));
}

export function generateBrief(leadId: string) {
  setState((s) =>
    patchLead(s, leadId, (l) => {
      const unitIds = l.unitIds.length ? l.unitIds : matchUnits(l, s.units).map((u) => u.id);
      return {
        ...l,
        unitIds,
        briefGeneratedAt: nowIso(),
        messages: [...l.messages, msg("system", "Investment brief generated")],
      };
    }),
  );
}

export function bookCall(leadId: string, at: string) {
  setState((s) => {
    const lead = s.leads.find((l) => l.id === leadId)!;
    const advisor = lead.advisorId ?? routeLead(lead, s.advisors, s.leads)?.id;
    const next = patchLead(s, leadId, (l) => ({
      ...l,
      advisorId: advisor,
      stage: l.stage === "new" || l.stage === "qualified" ? "call_booked" : l.stage,
      booking: { at, advisorId: advisor!, timezone: l.timezone, remindersSent: [] },
      nextFollowUp: undefined,
      messages: [...l.messages, msg("system", `Call booked for ${new Date(at).toUTCString()}`)],
    }));
    return { ...next, audit: audit(s, "Booked call", leadId) };
  });
}

export function fillTemplate(t: Template, lead: Lead, s: State) {
  const advisor = s.advisors.find((a) => a.id === (lead.booking?.advisorId ?? lead.advisorId));
  const body = t.body[lead.language] ?? t.body.en ?? "";
  const time = lead.booking
    ? new Date(lead.booking.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: lead.timezone })
    : "";
  return body
    .replaceAll("{{name}}", lead.name.split(" ")[0])
    .replaceAll("{{advisor}}", advisor?.name.split(" ")[0] ?? "our advisor")
    .replaceAll("{{brief}}", `/brief/${lead.id}`)
    .replaceAll("{{calendly}}", advisor?.calendlyUrl ?? "")
    .replaceAll("{{link}}", "https://nghpropertygroup.com")
    .replaceAll("{{time}}", time)
    .replaceAll("{{tz}}", lead.timezone);
}

const SEQUENCE: TemplateKind[] = ["day1", "day3", "day7", "day14"];
const GAP_DAYS = [1, 2, 4, 7]; // day 1 → 3 → 7 → 14

/** Lead is eligible for automated messages (FR-17). */
export function automationAllowed(l: Lead) {
  return !l.optedOut && l.mode === "bot" && l.consent !== "withdrawn" && l.stage !== "won" && l.stage !== "lost";
}

/**
 * Simulates the scheduler: sends due follow-ups (FR-15) and call reminders
 * (FR-16). In production this runs as a cron job against the CRM.
 */
export function runAutomations(at = Date.now()) {
  let sent = 0;
  setState((s) => {
    if (!s.settings.followUpsEnabled) return s;
    const leads = s.leads.map((l) => {
      let lead = l;
      // Reminders
      if (lead.booking && !lead.optedOut) {
        const until = Date.parse(lead.booking.at) - at;
        const due: ("24h" | "1h")[] = [];
        if (until > 0 && until <= 24 * 3600e3 && !lead.booking.remindersSent.includes("24h")) due.push("24h");
        if (until > 0 && until <= 3600e3 && !lead.booking.remindersSent.includes("1h")) due.push("1h");
        for (const r of due) {
          const t = s.templates.find((x) => x.kind === (r === "24h" ? "reminder24" : "reminder1") && x.active);
          if (!t) continue;
          sent++;
          lead = {
            ...lead,
            booking: { ...lead.booking!, remindersSent: [...lead.booking!.remindersSent, r] },
            messages: [...lead.messages, msg("bot", fillTemplate(t, lead, s), { sources: [t.id] })],
          };
        }
      }
      // Sequences for unbooked leads
      if (
        !lead.booking &&
        automationAllowed(lead) &&
        lead.nextFollowUp &&
        Date.parse(lead.nextFollowUp) <= at &&
        lead.followUpStep < SEQUENCE.length
      ) {
        const t = s.templates.find((x) => x.kind === SEQUENCE[lead.followUpStep] && x.active);
        const step = lead.followUpStep + 1;
        const gap = GAP_DAYS[step];
        if (t && (t.channel === "email" || t.metaApproved)) {
          sent++;
          lead = {
            ...lead,
            followUpStep: step,
            nextFollowUp: gap ? new Date(at + gap * 864e5).toISOString() : undefined,
            lastMessageAt: new Date(at).toISOString(),
            messages: [
              ...lead.messages,
              msg("bot", fillTemplate(t, lead, s), { sources: [t.id], at: new Date(at).toISOString() }),
            ],
          };
        }
      }
      return lead;
    });
    return { ...s, leads };
  });
  return sent;
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => {
    const settings = { ...s.settings, ...patch };
    // Re-score every lead when the rules change.
    const leads = patch.scoring ? s.leads.map((l) => ({ ...l, score: scoreLead(l, settings.scoring) })) : s.leads;
    return { ...s, settings, leads, audit: audit(s, "Updated settings") };
  });
}

export function saveKb(article: KbArticle) {
  setState((s) => {
    const exists = s.kb.some((k) => k.id === article.id);
    const next = { ...article, updatedAt: nowIso() };
    return {
      ...s,
      kb: exists ? s.kb.map((k) => (k.id === article.id ? next : k)) : [next, ...s.kb],
      audit: audit(s, `${exists ? "Edited" : "Added"} KB article “${article.title}”`),
    };
  });
}

export function deleteKb(id: string) {
  setState((s) => ({ ...s, kb: s.kb.filter((k) => k.id !== id), audit: audit(s, "Deleted KB article") }));
}

export function saveUnit(unit: Unit) {
  setState((s) => ({ ...s, units: s.units.map((u) => (u.id === unit.id ? unit : u)) }));
}

export function saveAssumptions(a: Assumptions) {
  setState((s) => ({
    ...s,
    assumptions: { ...a, updatedAt: nowIso() },
    audit: audit(s, "Updated scenario assumptions"),
  }));
}

export function saveTemplate(t: Template) {
  setState((s) => ({ ...s, templates: s.templates.map((x) => (x.id === t.id ? t : x)) }));
}

export function switchUser(advisorId: string) {
  setState((s) => ({ ...s, me: advisorId }));
}
