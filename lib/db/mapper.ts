// Converts between Prisma rows and the app's domain types (lib/types.ts).
// Domain objects use ISO strings and optional fields; rows use Date and null.

import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  Advisor as AdvisorRow,
  AuditEntry as AuditRow,
  Booking as BookingRow,
  KbArticle as KbRow,
  Lead as LeadRow,
  Message as MessageRow,
  QaReview as QaRow,
  Template as TemplateRow,
  Unit as UnitRow,
} from "@/lib/generated/prisma/client";
import type {
  Advisor,
  AssetRef,
  Assumptions,
  AuditEntry,
  Budget,
  KbArticle,
  Lead,
  Message,
  QaReview,
  Settings,
  Template,
  Timeline,
  Unit,
} from "@/lib/types";

const iso = (d: Date) => d.toISOString();
const isoOpt = (d: Date | null) => (d ? d.toISOString() : undefined);
const date = (s: string) => new Date(s);
const dateOpt = (s: string | undefined) => (s ? new Date(s) : null);
const json = (v: unknown) => v as Prisma.InputJsonValue;

/** Drop undefined keys so objects read back from the DB match ones built in the app. */
function compact<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

// --- Advisors ----------------------------------------------------------------

export const advisorFromRow = (a: AdvisorRow): Advisor => ({
  id: a.id,
  name: a.name,
  title: a.title,
  languages: a.languages,
  projects: a.projects,
  senior: a.senior,
  calendlyUrl: a.calendlyUrl,
  email: a.email,
  role: a.role,
});

export const advisorToRow = (a: Advisor) => ({
  name: a.name,
  title: a.title,
  languages: a.languages,
  projects: a.projects,
  senior: a.senior,
  calendlyUrl: a.calendlyUrl,
  email: a.email,
  role: a.role,
});

// --- Leads, messages, bookings -------------------------------------------------

export type LeadWithRelations = LeadRow & { messages: MessageRow[]; booking: BookingRow | null };

export function messageFromRow(m: MessageRow): Message {
  return compact({
    id: m.id,
    author: m.author,
    advisorId: m.advisorId ?? undefined,
    text: m.text,
    at: iso(m.at),
    internal: m.internal || undefined,
    assets: (m.assets as AssetRef[] | null) ?? undefined,
    sources: m.sources.length ? m.sources : undefined,
    voice: m.voiceDurationSec != null ? { durationSec: m.voiceDurationSec } : undefined,
  });
}

export function messageToRow(leadId: string, m: Message, position: number): Prisma.MessageCreateManyInput {
  return {
    id: m.id,
    leadId,
    position,
    author: m.author,
    advisorId: m.advisorId ?? null,
    text: m.text,
    at: date(m.at),
    internal: m.internal ?? false,
    assets: m.assets ? json(m.assets) : undefined,
    sources: m.sources ?? [],
    voiceDurationSec: m.voice?.durationSec ?? null,
  };
}

export function leadFromRow(l: LeadWithRelations): Lead {
  return compact({
    id: l.id,
    name: l.name,
    country: l.country,
    language: l.language,
    timezone: l.timezone,
    phone: l.phone ?? undefined,
    email: l.email ?? undefined,
    channel: l.channel,
    source: l.source,
    sourceDetail: l.sourceDetail ?? undefined,
    project: l.project,
    budget: (l.budget as Budget | null) ?? undefined,
    timeline: (l.timeline as Timeline | null) ?? undefined,
    purpose: l.purpose ?? undefined,
    ownership: l.ownership ?? undefined,
    financing: l.financing ?? undefined,
    score: l.score,
    stage: l.stage,
    advisorId: l.advisorId ?? undefined,
    consent: l.consent,
    optedOut: l.optedOut,
    mode: l.mode,
    escalation: l.escalation ?? undefined,
    createdAt: iso(l.createdAt),
    lastMessageAt: iso(l.lastMessageAt),
    unread: l.unread,
    messages: [...l.messages].sort((a, b) => a.position - b.position).map(messageFromRow),
    topics: l.topics,
    objections: l.objections,
    unanswered: l.unanswered.length ? l.unanswered : undefined,
    briefGeneratedAt: isoOpt(l.briefGeneratedAt),
    unitIds: l.unitIds,
    booking: l.booking
      ? {
          at: iso(l.booking.at),
          advisorId: l.booking.advisorId,
          timezone: l.booking.timezone,
          remindersSent: l.booking.remindersSent as ("24h" | "1h")[],
        }
      : undefined,
    followUpStep: l.followUpStep,
    nextFollowUp: isoOpt(l.nextFollowUp),
    lostReason: l.lostReason ?? undefined,
    starred: l.starred || undefined,
  });
}

/** Lead scalars only; messages and booking are written separately. */
export function leadToRow(l: Lead) {
  return {
    name: l.name,
    country: l.country,
    language: l.language,
    timezone: l.timezone,
    phone: l.phone ?? null,
    email: l.email ?? null,
    channel: l.channel,
    source: l.source,
    sourceDetail: l.sourceDetail ?? null,
    project: l.project,
    budget: l.budget ?? null,
    timeline: l.timeline ?? null,
    purpose: l.purpose ?? null,
    ownership: l.ownership ?? null,
    financing: l.financing ?? null,
    score: l.score,
    stage: l.stage,
    advisorId: l.advisorId ?? null,
    consent: l.consent,
    optedOut: l.optedOut,
    mode: l.mode,
    escalation: l.escalation ?? null,
    createdAt: date(l.createdAt),
    lastMessageAt: date(l.lastMessageAt),
    unread: l.unread,
    topics: l.topics,
    objections: l.objections,
    unanswered: l.unanswered ?? [],
    briefGeneratedAt: dateOpt(l.briefGeneratedAt),
    unitIds: l.unitIds,
    followUpStep: l.followUpStep,
    nextFollowUp: dateOpt(l.nextFollowUp),
    lostReason: l.lostReason ?? null,
    starred: l.starred ?? false,
  };
}

export const bookingToRow = (b: NonNullable<Lead["booking"]>) => ({
  at: date(b.at),
  advisorId: b.advisorId,
  timezone: b.timezone,
  remindersSent: b.remindersSent,
});

// --- Knowledge base, units, templates --------------------------------------------

export const kbFromRow = (k: KbRow): KbArticle =>
  compact({
    id: k.id,
    category: k.category,
    title: k.title,
    keywords: k.keywords,
    body: k.body as KbArticle["body"],
    approved: k.approved,
    escalate: k.escalate || undefined,
    owner: k.owner,
    updatedAt: iso(k.updatedAt),
  });

export const kbToRow = (k: KbArticle) => ({
  category: k.category,
  title: k.title,
  keywords: k.keywords,
  body: json(k.body),
  approved: k.approved,
  escalate: k.escalate ?? false,
  owner: k.owner,
  updatedAt: date(k.updatedAt),
});

export const unitToRow = (u: Unit) => ({
  project: u.project,
  name: u.name,
  type: u.type,
  bedrooms: u.bedrooms,
  sizeSqm: u.sizeSqm,
  priceUsd: u.priceUsd,
  leaseYears: u.leaseYears,
  status: u.status,
  handover: u.handover,
  adrUsd: u.adrUsd,
});

export const unitFromRow = (u: UnitRow): Unit => ({ id: u.id, ...unitToRow(u) });

export const templateFromRow = (t: TemplateRow): Template => ({
  id: t.id,
  kind: t.kind,
  name: t.name,
  channel: t.channel,
  body: t.body as Template["body"],
  metaApproved: t.metaApproved,
  active: t.active,
});

export const templateToRow = (t: Template) => ({
  kind: t.kind,
  name: t.name,
  channel: t.channel,
  body: json(t.body),
  metaApproved: t.metaApproved,
  active: t.active,
});

// --- Audit, QA, config ---------------------------------------------------------

export const auditFromRow = (a: AuditRow): AuditEntry =>
  compact({ id: a.id, at: iso(a.at), actor: a.actor, action: a.action, leadId: a.leadId ?? undefined });

export const auditToRow = (a: AuditEntry): Prisma.AuditEntryCreateManyInput => ({
  id: a.id,
  at: date(a.at),
  actor: a.actor,
  action: a.action,
  leadId: a.leadId ?? null,
});

export const qaFromRow = (q: QaRow): QaReview =>
  compact({
    id: q.id,
    leadId: q.leadId,
    messageId: q.messageId,
    verdict: q.verdict,
    issue: q.issue ?? undefined,
    note: q.note ?? undefined,
    reviewer: q.reviewer,
    at: iso(q.at),
  });

export const qaToRow = (q: QaReview) => ({
  leadId: q.leadId,
  messageId: q.messageId,
  verdict: q.verdict,
  issue: q.issue ?? null,
  note: q.note ?? null,
  reviewer: q.reviewer,
  at: date(q.at),
});

export const configToRow = (c: { version: number; settings: Settings; assumptions: Assumptions }) => ({
  version: c.version,
  settings: json(c.settings),
  assumptions: json(c.assumptions),
});
