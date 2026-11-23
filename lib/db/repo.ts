// Reads and writes the shared workspace state in Postgres. The browser store
// loads everything with loadState() and sends per-record changes to
// applyChanges(); reseed() restores the demo data.

import type { Prisma } from "@/lib/generated/prisma/client";
import { seedState } from "@/lib/seed";
import type { Assumptions, Lead, Settings } from "@/lib/types";
import { COLLECTIONS, type Changes, type SharedState } from "./changes";
import {
  advisorFromRow,
  advisorToRow,
  auditFromRow,
  auditToRow,
  bookingToRow,
  configToRow,
  kbFromRow,
  kbToRow,
  leadFromRow,
  leadToRow,
  messageToRow,
  qaFromRow,
  qaToRow,
  templateFromRow,
  templateToRow,
  unitFromRow,
  unitToRow,
} from "./mapper";
import { prisma } from "./prisma";

type Tx = Prisma.TransactionClient;

const TX = { timeout: 30_000, maxWait: 10_000 };

export class EmptyDatabaseError extends Error {
  constructor() {
    super("The database has no workspace data yet. Run `npm run db:seed`.");
  }
}

export async function loadState(): Promise<SharedState> {
  const [config, advisors, leads, kb, units, templates, audit, qa] = await Promise.all([
    prisma.appConfig.findUnique({ where: { id: 1 } }),
    prisma.advisor.findMany({ orderBy: { seq: "asc" } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, include: { messages: true, booking: true } }),
    prisma.kbArticle.findMany({ orderBy: { seq: "asc" } }),
    prisma.unit.findMany({ orderBy: { seq: "asc" } }),
    prisma.template.findMany({ orderBy: { seq: "asc" } }),
    prisma.auditEntry.findMany({ orderBy: { at: "desc" } }),
    prisma.qaReview.findMany({ orderBy: { at: "desc" } }),
  ]);
  if (!config) throw new EmptyDatabaseError();
  return {
    version: config.version,
    settings: config.settings as unknown as Settings,
    assumptions: config.assumptions as unknown as Assumptions,
    advisors: advisors.map(advisorFromRow),
    leads: leads.map(leadFromRow),
    kb: kb.map(kbFromRow),
    units: units.map(unitFromRow),
    templates: templates.map(templateFromRow),
    audit: audit.map(auditFromRow),
    qa: qa.map(qaFromRow),
  };
}

async function writeLead(tx: Tx, lead: Lead) {
  const row = leadToRow(lead);
  await tx.lead.upsert({ where: { id: lead.id }, create: { id: lead.id, ...row }, update: row });

  if (lead.booking) {
    const booking = bookingToRow(lead.booking);
    await tx.booking.upsert({ where: { leadId: lead.id }, create: { leadId: lead.id, ...booking }, update: booking });
  } else {
    await tx.booking.deleteMany({ where: { leadId: lead.id } });
  }

  // Conversations are append-only, so new messages are inserted and existing ones kept.
  const ids = lead.messages.map((m) => m.id);
  await tx.message.deleteMany({ where: { leadId: lead.id, id: { notIn: ids } } });
  if (ids.length) {
    await tx.message.createMany({
      data: lead.messages.map((m, i) => messageToRow(lead.id, m, i)),
      skipDuplicates: true,
    });
  }
}

async function apply(tx: Tx, changes: Changes) {
  // Removals first: a re-reviewed QA answer replaces its row, and messageId is unique.
  const removeOrder = ["qa", "audit", "leads", "kb", "units", "templates", "advisors"] as const;
  for (const key of removeOrder) {
    const ids = changes[key]?.remove;
    if (!ids?.length) continue;
    const where = { where: { id: { in: ids } } };
    if (key === "qa") await tx.qaReview.deleteMany(where);
    if (key === "audit") await tx.auditEntry.deleteMany(where);
    if (key === "leads") await tx.lead.deleteMany(where);
    if (key === "kb") await tx.kbArticle.deleteMany(where);
    if (key === "units") await tx.unit.deleteMany(where);
    if (key === "templates") await tx.template.deleteMany(where);
    if (key === "advisors") await tx.advisor.deleteMany(where);
  }

  if (changes.config) {
    const row = configToRow(changes.config);
    await tx.appConfig.upsert({ where: { id: 1 }, create: { id: 1, ...row }, update: row });
  }

  // Advisors before leads and bookings that reference them.
  for (const a of changes.advisors?.upsert ?? []) {
    const row = advisorToRow(a);
    await tx.advisor.upsert({ where: { id: a.id }, create: { id: a.id, ...row }, update: row });
  }
  for (const u of changes.units?.upsert ?? []) {
    const row = unitToRow(u);
    await tx.unit.upsert({ where: { id: u.id }, create: { id: u.id, ...row }, update: row });
  }
  for (const k of changes.kb?.upsert ?? []) {
    const row = kbToRow(k);
    await tx.kbArticle.upsert({ where: { id: k.id }, create: { id: k.id, ...row }, update: row });
  }
  for (const t of changes.templates?.upsert ?? []) {
    const row = templateToRow(t);
    await tx.template.upsert({ where: { id: t.id }, create: { id: t.id, ...row }, update: row });
  }
  for (const l of changes.leads?.upsert ?? []) await writeLead(tx, l);
  // The audit log is append-only.
  if (changes.audit?.upsert.length) {
    await tx.auditEntry.createMany({ data: changes.audit.upsert.map(auditToRow), skipDuplicates: true });
  }
  for (const q of changes.qa?.upsert ?? []) {
    const row = qaToRow(q);
    await tx.qaReview.upsert({ where: { id: q.id }, create: { id: q.id, ...row }, update: row });
  }
}

export async function applyChanges(changes: Changes) {
  await prisma.$transaction((tx) => apply(tx, changes), TX);
}

/** Wipe the workspace and load the demo data with timestamps relative to `now`. */
export async function reseed(now = Date.now()) {
  const seed = seedState(now); // `me` is per browser and not stored
  const changes: Changes = {
    config: { version: seed.version, settings: seed.settings, assumptions: seed.assumptions },
  };
  for (const key of COLLECTIONS) {
    (changes as Record<string, unknown>)[key] = { upsert: seed[key], remove: [] };
  }
  await prisma.$transaction(async (tx) => {
    await tx.qaReview.deleteMany();
    await tx.auditEntry.deleteMany();
    await tx.lead.deleteMany(); // messages and bookings cascade
    await tx.kbArticle.deleteMany();
    await tx.unit.deleteMany();
    await tx.template.deleteMany();
    await tx.advisor.deleteMany();
    await tx.appConfig.deleteMany();
    await apply(tx, changes);
  }, TX);
}
