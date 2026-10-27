"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock,
  Flame,
  Link2,
  MessageSquareReply,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { Avatar, Badge, buttonStyles, Card, CardBody, CardHeader, EmptyState, Meter, PageHeader, Stat } from "@/components/ui";
import { ChannelIcon, LangTag, ScoreBadge } from "@/components/domain";
import { useNow, useStore } from "@/lib/store";
import { computeKpis } from "@/lib/metrics";
import { STAGES } from "@/lib/labels";
import { dateTime, duration, relTime } from "@/lib/format";

export function Overview() {
  const state = useStore((s) => s);
  const now = useNow();
  const me = state.advisors.find((a) => a.id === state.me)!;
  const k = useMemo(() => computeKpis(state), [state]);

  const attention = useMemo(
    () =>
      state.leads
        .filter((l) => l.stage !== "won" && l.stage !== "lost")
        .filter((l) => l.escalation || (l.score === "hot" && l.unread > 0))
        .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)),
    [state.leads],
  );

  const upcoming = useMemo(
    () =>
      state.leads
        .filter((l) => l.booking && Date.parse(l.booking.at) > now)
        .sort((a, b) => Date.parse(a.booking!.at) - Date.parse(b.booking!.at)),
    [state.leads, now],
  );

  const byStage = STAGES.map((s) => ({ ...s, n: state.leads.filter((l) => l.stage === s.value).length }));
  const maxStage = Math.max(1, ...byStage.map((s) => s.n));
  const costPct = (state.settings.costSpentUsd / state.settings.costCapUsd) * 100;

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title={`Welcome back, ${me.name.split(" ")[0]}`}
        description="Uluwatu Paradise · investor concierge pilot"
        actions={
          <Link href="/inbox" className={buttonStyles({ variant: "primary" })}>
            Open inbox <ArrowRight />
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Stat icon={Zap} label="Median first reply" value={duration(k.medianFirstResponseMs)} target="< 1 min" good={k.medianFirstResponseMs < 60_000} delta={k.medianFirstResponseMs < 60_000 ? "On target" : "Above target"} />
          <Stat icon={MessageSquareReply} label="Resolved without human" value={`${k.resolvedWithoutHumanPct.toFixed(0)}%`} target="≥ 60%" good={k.resolvedWithoutHumanPct >= 60} delta={k.resolvedWithoutHumanPct >= 60 ? "On target" : "Below target"} />
          <Stat icon={Target} label="Booked calls qualified" value={`${k.qualifiedBookedPct.toFixed(0)}%`} target="≥ 70%" good={k.qualifiedBookedPct >= 70} delta={k.qualifiedBookedPct >= 70 ? "On target" : "Below target"} />
          <Stat icon={CalendarCheck} label="Calls booked" value={k.callsBooked} target="+30% vs baseline" delta="Baseline set in week 1" />
          <Stat icon={Clock} label="Leads with follow-up" value={`${k.followUpCoveragePct.toFixed(0)}%`} target="100%" good={k.followUpCoveragePct >= 99.5} delta={`${k.leads} leads total`} />
          <Stat icon={Link2} label="Source attribution" value={`${k.attributionPct.toFixed(0)}%`} target="≥ 95%" good={k.attributionPct >= 95} delta={k.attributionPct >= 95 ? "On target" : "Below target"} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader
              title="Needs your attention"
              description="Escalations and unread Hot leads"
              actions={<Badge tone={attention.length ? "hot" : "neutral"}>{attention.length}</Badge>}
            />
            {attention.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="All clear" description="No escalations or unread Hot leads right now." />
            ) : (
              <ul className="divide-y divide-line">
                {attention.map((l) => (
                  <li key={l.id}>
                    <Link href={`/inbox?c=${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle">
                      <Avatar name={l.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{l.name}</span>
                          <ChannelIcon channel={l.channel} />
                          <LangTag lang={l.language} />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
                          {l.escalation ? (
                            <>
                              <AlertTriangle className="size-3 text-warning" /> {l.escalation}
                            </>
                          ) : (
                            <>
                              <Flame className="size-3 text-hot" /> {l.unread} unread message{l.unread > 1 && "s"}
                            </>
                          )}
                        </p>
                      </div>
                      <ScoreBadge score={l.score} />
                      <span className="w-10 text-right text-2xs text-ink-subtle">{relTime(l.lastMessageAt, now)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Upcoming calls" description="Booked via Calendly, shown in the lead's time zone" />
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="No calls booked" />
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((l) => {
                  const advisor = state.advisors.find((a) => a.id === l.booking!.advisorId);
                  return (
                    <li key={l.id}>
                      <Link href={`/leads/${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle">
                        <div className="w-14 shrink-0 rounded-sm border border-line bg-subtle py-1 text-center">
                          <p className="text-2xs text-ink-subtle uppercase">{relTime(l.booking!.at, now)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className="truncate text-xs text-ink-muted">
                            {dateTime(l.booking!.at, l.timezone)} · {l.timezone.split("/")[1]?.replace("_", " ")}
                          </p>
                        </div>
                        {advisor && <Avatar name={advisor.name} size="sm" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader
              title="Pipeline"
              actions={
                <Link href="/pipeline" className={buttonStyles({ size: "sm", variant: "ghost" })}>
                  View board <ArrowRight />
                </Link>
              }
            />
            <CardBody className="space-y-2.5">
              {byStage.map((s) => (
                <div key={s.value} className="grid grid-cols-[96px_1fr_24px] items-center gap-3 text-sm">
                  <span className="text-ink-muted">{s.label}</span>
                  <Meter value={s.n} max={maxStage} tone={s.value === "won" ? "success" : s.value === "lost" ? "danger" : "accent"} className="h-2" />
                  <span className="text-right font-medium tabular-nums">{s.n}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Running costs" description={`AI + messaging this month · alert at ${state.settings.alertAtPct}%`} />
            <CardBody className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tabular-nums">${state.settings.costSpentUsd}</span>
                <span className="text-xs text-ink-subtle">of ${state.settings.costCapUsd} cap</span>
              </div>
              <Meter value={costPct} tone={costPct >= state.settings.alertAtPct ? "warning" : "accent"} />
              <p className="text-xs text-ink-muted">
                {k.afterHoursPct.toFixed(0)}% of first messages arrived outside Bali business hours — answered instantly by the concierge.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
