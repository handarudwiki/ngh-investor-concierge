"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BellOff,
  CalendarCheck,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import { Avatar, Badge, Button, buttonStyles, Select } from "@/components/ui";
import { ChannelIcon, LangTag, Prop, ScoreBadge } from "@/components/domain";
import { BookCallDialog } from "./book-call-dialog";
import { assignAdvisor, generateBrief, optOut, setStage } from "@/lib/actions";
import {
  BUDGETS,
  CHANNELS,
  FINANCING,
  LANGUAGES,
  OWNERSHIP,
  PURPOSES,
  SOURCES,
  STAGES,
  TIMELINES,
} from "@/lib/labels";
import { scorePoints } from "@/lib/rules";
import { dateTime, relTime } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Lead, Stage } from "@/lib/types";

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="text-2xs font-semibold tracking-wide text-ink-subtle uppercase">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The advisor handoff summary (FR-14): profile, questions, objections, score, brief. */
export function LeadSummary({ lead, showProfileLink = true }: { lead: Lead; showProfileLink?: boolean }) {
  const advisors = useStore((s) => s.advisors);
  const rules = useStore((s) => s.settings.scoring);
  const units = useStore((s) => s.units);
  const now = useNow();
  const [booking, setBooking] = useState(false);
  const points = scorePoints(lead, rules);
  const matched = units.filter((u) => lead.unitIds.includes(u.id));

  return (
    <div className="text-sm">
      <div className="flex flex-col items-center gap-2 border-b border-line px-4 py-5 text-center">
        <Avatar name={lead.name} size="lg" />
        <div>
          <p className="font-semibold">{lead.name}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <ChannelIcon channel={lead.channel} /> {lead.country} <LangTag lang={lead.language} />
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <ScoreBadge score={lead.score} />
          {lead.mode === "human" && <Badge tone="info">Human handling</Badge>}
          {lead.optedOut && <Badge tone="danger">Opted out</Badge>}
        </div>
        {showProfileLink && (
          <Link href={`/leads/${lead.id}`} className={buttonStyles({ size: "xs", variant: "ghost" })}>
            Full profile <ExternalLink />
          </Link>
        )}
      </div>

      {lead.escalation && (
        <div className="flex gap-2 border-b border-line bg-warning-soft px-4 py-2.5 text-xs text-warning">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>
            <b className="font-semibold">Escalated:</b> {lead.escalation}
          </span>
        </div>
      )}

      <Section title="Pipeline">
        <div className="grid grid-cols-2 gap-2">
          <Select value={lead.stage} onChange={(e) => setStage(lead.id, e.target.value as Stage)} aria-label="Stage">
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select value={lead.advisorId ?? ""} onChange={(e) => assignAdvisor(lead.id, e.target.value)} aria-label="Advisor">
            <option value="" disabled>
              Unassigned
            </option>
            {advisors
              .filter((a) => a.role === "advisor")
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </Select>
        </div>
      </Section>

      <Section title="Qualification" action={<span className="text-2xs text-ink-subtle">{points} pts</span>}>
        <dl>
          <Prop label="Budget">{lead.budget && BUDGETS[lead.budget]}</Prop>
          <Prop label="Timeline">{lead.timeline && TIMELINES[lead.timeline]}</Prop>
          <Prop label="Purpose">{lead.purpose && PURPOSES[lead.purpose]}</Prop>
          <Prop label="Ownership">{lead.ownership && OWNERSHIP[lead.ownership]}</Prop>
          <Prop label="Financing">{lead.financing && FINANCING[lead.financing]}</Prop>
        </dl>
      </Section>

      <Section title="Contact">
        <dl>
          <Prop label="Email">{lead.email}</Prop>
          <Prop label="Phone">{lead.phone}</Prop>
          <Prop label="Language">{LANGUAGES[lead.language].label}</Prop>
          <Prop label="Time zone">{lead.timezone}</Prop>
          <Prop label="Source">
            {SOURCES[lead.source]}
            {lead.sourceDetail && <span className="text-ink-subtle"> · {lead.sourceDetail}</span>}
          </Prop>
          <Prop label="Channel">{CHANNELS[lead.channel]}</Prop>
          <Prop label="Consent">
            <Badge tone={lead.consent === "granted" ? "success" : lead.consent === "pending" ? "warning" : "danger"}>
              {lead.consent}
            </Badge>
          </Prop>
        </dl>
      </Section>

      {(lead.topics.length > 0 || lead.objections.length > 0) && (
        <Section title="Asked about">
          <div className="flex flex-wrap gap-1">
            {lead.topics.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          {lead.objections.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-ink-muted">
              {lead.objections.map((o) => (
                <li key={o} className="flex gap-1.5">
                  <span className="text-warning">●</span> {o}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Next step">
        {lead.booking ? (
          <div className="rounded-sm border border-info/20 bg-info-soft px-3 py-2 text-xs text-info">
            <p className="font-medium">
              Call {Date.parse(lead.booking.at) > now ? relTime(lead.booking.at, now) : "held"} ·{" "}
              {advisors.find((a) => a.id === lead.booking!.advisorId)?.name}
            </p>
            <p className="mt-0.5 opacity-80">{dateTime(lead.booking.at, lead.timezone)} (lead&apos;s time)</p>
            <p className="mt-0.5 opacity-80">
              Reminders sent: {lead.booking.remindersSent.length ? lead.booking.remindersSent.join(", ") : "none yet"}
            </p>
          </div>
        ) : lead.nextFollowUp ? (
          <p className="text-xs text-ink-muted">
            Follow-up step {lead.followUpStep + 1} of 4 · {relTime(lead.nextFollowUp, now)}
          </p>
        ) : (
          <p className="text-xs text-ink-subtle">No follow-up scheduled</p>
        )}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => setBooking(true)} disabled={lead.optedOut}>
            <CalendarCheck /> {lead.booking ? "Rebook" : "Book call"}
          </Button>
          {lead.briefGeneratedAt ? (
            <Link href={`/brief/${lead.id}`} target="_blank" className={buttonStyles({ size: "sm" })}>
              <FileText /> Open brief
            </Link>
          ) : (
            <Button size="sm" onClick={() => generateBrief(lead.id)}>
              <Sparkles /> Generate brief
            </Button>
          )}
        </div>
        {matched.length > 0 && (
          <p className="mt-2 text-2xs text-ink-subtle">Matched: {matched.map((u) => u.name).join(", ")}</p>
        )}
      </Section>

      {!lead.optedOut && (
        <div className="px-4 py-3">
          <Button size="xs" variant="ghost" onClick={() => optOut(lead.id)}>
            <BellOff /> Mark as opted out
          </Button>
        </div>
      )}
      <BookCallDialog lead={lead} open={booking} onClose={() => setBooking(false)} />
    </div>
  );
}
