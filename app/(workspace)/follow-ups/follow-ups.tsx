"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellOff, CalendarClock, Check, Mail, MessageCircle, Pause, Play, Send, ShieldAlert } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, Segmented, Switch, Tabs, Textarea } from "@/components/ui";
import { LangTag } from "@/components/domain";
import { ReadOnlyNotice } from "@/components/shell/access";
import { cn } from "@/lib/cn";
import { automationAllowed, editLead, fillTemplate, runAutomations, saveTemplate, updateSettings } from "@/lib/actions";
import { LANGUAGES } from "@/lib/labels";
import { useCan } from "@/lib/permissions";
import { dateTime, relTime } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Language, Lead, Template, TemplateKind } from "@/lib/types";

const SEQUENCE: TemplateKind[] = ["day1", "day3", "day7", "day14"];

function pauseReason(l: Lead) {
  if (l.optedOut) return "Opted out";
  if (l.consent === "withdrawn") return "Consent withdrawn";
  if (l.mode === "human") return "Advisor took over";
  if (l.stage === "won" || l.stage === "lost") return `Closed (${l.stage})`;
  return undefined;
}

function Queue({ now }: { now: number }) {
  const leads = useStore((s) => s.leads);
  const templates = useStore((s) => s.templates);
  const rows = useMemo(
    () =>
      leads
        .filter((l) => l.nextFollowUp && !l.booking && automationAllowed(l))
        .sort((a, b) => Date.parse(a.nextFollowUp!) - Date.parse(b.nextFollowUp!)),
    [leads],
  );
  if (!rows.length) return <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Unbooked leads get a day-1 follow-up automatically." />;
  return (
    <ul className="divide-y divide-line">
      {rows.map((l) => {
        const t = templates.find((x) => x.kind === SEQUENCE[l.followUpStep]);
        const blocked = t && t.channel === "whatsapp" && !t.metaApproved;
        const due = Date.parse(l.nextFollowUp!) <= now;
        return (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={l.name} size="sm" />
            <div className="min-w-0 flex-1">
              <Link href={`/leads/${l.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                {l.name} <LangTag lang={l.language} />
              </Link>
              <p className="truncate text-xs text-ink-muted">
                {t?.name ?? "Sequence complete"}
              </p>
            </div>
            {/* 4 dots = the 4-step sequence */}
            <div className="flex gap-1" aria-label={`Step ${l.followUpStep + 1} of 4`}>
              {SEQUENCE.map((_, i) => (
                <span key={i} className={cn("size-1.5 rounded-full", i < l.followUpStep ? "bg-accent" : i === l.followUpStep ? "bg-accent/40" : "bg-muted")} />
              ))}
            </div>
            {t && (t.channel === "whatsapp" ? <MessageCircle className="size-3.5 text-whatsapp" /> : <Mail className="size-3.5 text-info" />)}
            {blocked ? (
              <Badge tone="warning" title="WhatsApp messages outside the 24h window need a Meta-approved template">
                <ShieldAlert /> Needs Meta approval
              </Badge>
            ) : (
              <span className={cn("w-20 text-right text-xs", due ? "font-medium text-warning" : "text-ink-subtle")}>{due ? "Due now" : relTime(l.nextFollowUp!, now)}</span>
            )}
            <Button
              size="xs"
              disabled={blocked}
              onClick={() => {
                editLead(l.id, (x) => ({ ...x, nextFollowUp: new Date().toISOString() }));
                runAutomations();
              }}
            >
              <Send /> Send now
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function Reminders({ now }: { now: number }) {
  const leads = useStore((s) => s.leads);
  const advisors = useStore((s) => s.advisors);
  const rows = useMemo(
    () => leads.filter((l) => l.booking && Date.parse(l.booking.at) > now - 3600e3).sort((a, b) => Date.parse(a.booking!.at) - Date.parse(b.booking!.at)),
    [leads, now],
  );
  if (!rows.length) return <EmptyState icon={CalendarClock} title="No upcoming calls" />;
  return (
    <ul className="divide-y divide-line">
      {rows.map((l) => {
        const b = l.booking!;
        const advisor = advisors.find((a) => a.id === b.advisorId);
        return (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={l.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{l.name}</p>
              <p className="text-xs text-ink-muted">
                with {advisor?.name} · {dateTime(b.at, l.timezone)} ({l.timezone})
              </p>
            </div>
            {(["24h", "1h"] as const).map((r) => (
              <Badge key={r} tone={b.remindersSent.includes(r) ? "success" : "neutral"}>
                {b.remindersSent.includes(r) ? <Check /> : <CalendarClock />} {r} reminder
              </Badge>
            ))}
            <span className="w-16 text-right text-xs text-ink-subtle">{relTime(b.at, now)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Paused() {
  const leads = useStore((s) => s.leads);
  const rows = leads.filter((l) => pauseReason(l) && l.stage !== "won");
  return (
    <ul className="divide-y divide-line">
      {rows.map((l) => (
        <li key={l.id} className="flex items-center gap-3 px-4 py-3">
          <Avatar name={l.name} size="sm" />
          <Link href={`/leads/${l.id}`} className="flex-1 font-medium hover:underline">
            {l.name}
          </Link>
          <Badge tone={l.optedOut ? "danger" : "info"}>
            {l.optedOut ? <BellOff /> : <Pause />} {pauseReason(l)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function TemplateEditor() {
  const templates = useStore((s) => s.templates);
  const [id, setId] = useState(templates[0].id);
  const [lang, setLang] = useState<Language>("en");
  const t = templates.find((x) => x.id === id)!;
  const state = useStore((s) => s);
  const sample = state.leads.find((l) => l.id === "l7") ?? state.leads[0];
  const canEdit = useCan("templates.edit");
  const update = (patch: Partial<Template>) => saveTemplate({ ...t, ...patch });

  return (
    <div className="grid min-h-0 md:grid-cols-[240px_1fr]">
      <ul className="border-r border-line p-2">
        {templates.map((x) => (
          <li key={x.id}>
            <button
              onClick={() => setId(x.id)}
              className={cn("flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm", x.id === id ? "bg-accent-soft text-accent-ink" : "hover:bg-subtle")}
            >
              {x.channel === "whatsapp" ? <MessageCircle className="size-3.5 shrink-0 text-whatsapp" /> : <Mail className="size-3.5 shrink-0 text-info" />}
              <span className="flex-1 truncate">{x.name}</span>
              {!x.active && <span className="text-2xs text-ink-subtle">off</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-4 p-4">
        {!canEdit && <ReadOnlyNotice>Templates are edited and submitted to Meta by an admin.</ReadOnlyNotice>}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-semibold">{t.name}</h3>
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <Switch checked={t.active} onChange={(v) => update({ active: v })} label="Active" disabled={!canEdit} /> Active
          </label>
          {t.channel === "whatsapp" && (
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <Switch checked={t.metaApproved} onChange={(v) => update({ metaApproved: v })} label="Meta approved" disabled={!canEdit} /> Meta-approved template
            </label>
          )}
        </div>
        {t.channel === "whatsapp" && !t.metaApproved && (
          <p className="rounded-sm border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
            WhatsApp only allows free-form messages within 24 hours of the lead&apos;s last message. This template won&apos;t send until Meta approves it.
          </p>
        )}
        <Segmented
          value={lang}
          onChange={setLang}
          items={(Object.keys(LANGUAGES) as Language[]).map((l) => ({ value: l, label: `${LANGUAGES[l].flag}${t.body[l] ? "" : " ·"}` }))}
        />
        <Textarea
          key={`${t.id}-${lang}`}
          defaultValue={t.body[lang] ?? ""}
          placeholder={`No ${LANGUAGES[lang].label} version yet — leads in this language get the English template.`}
          readOnly={!canEdit}
          onBlur={(e) => canEdit && update({ body: { ...t.body, [lang]: e.target.value || undefined } })}
          className="min-h-28"
        />
        <p className="text-2xs text-ink-subtle">
          Variables: {"{{name}} {{advisor}} {{brief}} {{calendly}} {{link}} {{time}} {{tz}}"} · sequences must include an opt-out (“Reply STOP”).
        </p>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Preview for {sample?.name}</p>
          <div className="max-w-md rounded-lg rounded-tl-xs bg-accent-soft px-3.5 py-2.5 text-sm whitespace-pre-wrap">
            {sample && fillTemplate({ ...t, body: { [sample.language]: t.body[lang] ?? t.body.en } }, sample, state)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FollowUps() {
  const now = useNow();
  const enabled = useStore((s) => s.settings.followUpsEnabled);
  const canToggle = useCan("settings");
  const leads = useStore((s) => s.leads);
  const [tab, setTab] = useState<"queue" | "reminders" | "paused" | "templates">("queue");
  const [flash, setFlash] = useState<string>();

  const due = leads.filter((l) => l.nextFollowUp && Date.parse(l.nextFollowUp) <= now && automationAllowed(l) && !l.booking).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Follow-ups"
        description="Day 1, 3, 7 and 14 sequences for unbooked leads, plus call reminders. Automations stop on opt-out or takeover."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <Switch checked={enabled} onChange={(v) => updateSettings({ followUpsEnabled: v })} label="Automations" disabled={!canToggle} />
              {enabled ? "Automations on" : "Automations paused"}
            </label>
            <Button
              variant="primary"
              disabled={!enabled}
              onClick={() => {
                const n = runAutomations();
                setFlash(n ? `Sent ${n} message${n > 1 ? "s" : ""}` : "Nothing due right now");
                setTimeout(() => setFlash(undefined), 3000);
              }}
            >
              <Play /> Run scheduler{due ? ` (${due} due)` : ""}
            </Button>
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "queue", label: "Sequence queue" },
            { value: "reminders", label: "Call reminders" },
            { value: "paused", label: "Paused" },
            { value: "templates", label: "Templates" },
          ]}
        />
      </PageHeader>
      {flash && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-sm border border-success/20 bg-success-soft px-3 py-2 text-sm text-success animate-fade-in">
          <Check className="size-4" /> {flash}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <Card>
          {tab === "queue" && (
            <>
              <CardHeader title="Scheduled follow-ups" description="Only Meta-approved templates send on WhatsApp outside the 24-hour window" />
              <Queue now={now} />
            </>
          )}
          {tab === "reminders" && (
            <>
              <CardHeader title="Call reminders" description="Sent 24 hours and 1 hour before each booked call (FR-16)" />
              <Reminders now={now} />
            </>
          )}
          {tab === "paused" && (
            <>
              <CardHeader title="Automations paused" description="No automated message reaches these leads (FR-17)" />
              <Paused />
            </>
          )}
          {tab === "templates" && (
            <>
              <CardHeader title="Approved templates" description="Edited by marketing; changes apply to the next send" />
              <TemplateEditor />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
