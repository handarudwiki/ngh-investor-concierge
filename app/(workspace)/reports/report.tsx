"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarCheck, CircleHelp, Flag, Moon, Printer, Target, Users, Zap } from "lucide-react";
import { Avatar, Button, Card, CardBody, CardHeader, PageHeader, Segmented, Stat } from "@/components/ui";
import { Columns, HBars } from "@/components/charts";
import { computeKpis, topTopics, type Kpis } from "@/lib/metrics";
import { QA_TARGET_PCT, qaSample } from "@/lib/qa";
import { LANGUAGES, SOURCES, STAGES } from "@/lib/labels";
import { duration, TEAM_TZ } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";

type Period = 7 | 14 | 30;
const DAY = 864e5;

function delta(cur: number, prev: number, unit = "") {
  if (!prev && !cur) return { text: "No change", good: undefined };
  const diff = cur - prev;
  const text = `${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(0)}${unit} vs previous`;
  return { text, good: diff === 0 ? undefined : diff > 0 };
}

export function Report() {
  const state = useStore((s) => s);
  const now = useNow();
  const [period, setPeriod] = useState<Period>(7);
  const from = now - period * DAY;

  const { cur, prev, inRange } = useMemo(() => {
    const cur: Kpis = computeKpis(state, from, now + 1);
    const prev: Kpis = computeKpis(state, from - period * DAY, from);
    const inRange = state.leads.filter((l) => Date.parse(l.createdAt) >= from);
    return { cur, prev, inRange };
  }, [state, from, now, period]);

  const qa = useMemo(() => qaSample(state, now + 1, from), [state, now, from]);

  const daily = useMemo(
    () =>
      Array.from({ length: period }, (_, i) => {
        const start = from + i * DAY;
        const day = inRange.filter((l) => {
          const t = Date.parse(l.createdAt);
          return t >= start && t < start + DAY;
        });
        return {
          label: new Date(start + DAY / 2).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TEAM_TZ }),
          value: day.length,
          detail: day.length ? `${day.filter((l) => l.score === "hot").length} Hot` : undefined,
        };
      }),
    [inRange, from, period],
  );

  const count = <K extends string>(keyOf: (l: (typeof inRange)[number]) => K | undefined, label: (k: K) => string) => {
    const m = new Map<K, number>();
    inRange.forEach((l) => {
      const k = keyOf(l);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: label(k), value: v }));
  };

  const bySource = count((l) => l.source, (k) => SOURCES[k]);
  const byLanguage = count((l) => l.language, (k) => LANGUAGES[k].label);
  const topics = topTopics(inRange, 8).map(([label, value]) => ({ label, value }));
  const unanswered = inRange.flatMap((l) => (l.unanswered ?? []).map((q) => ({ q, lead: l })));
  const lostReasons = count((l) => (l.stage === "lost" ? l.lostReason ?? "No reason given" : undefined), (k) => k);

  // Funnel: how many leads reached each stage (or beyond), excluding lost.
  const order = STAGES.filter((s) => s.value !== "lost");
  const rank = (st: string) => order.findIndex((s) => s.value === st);
  const funnel = order.map((s, i) => ({
    label: s.label,
    value: inRange.filter((l) => l.stage !== "lost" && rank(l.stage) >= i).length,
  }));

  const advisors = state.advisors.filter((a) => a.role === "advisor");
  const takeovers = state.audit.filter((a) => a.action === "Took over conversation" && Date.parse(a.at) >= from);

  const d = {
    leads: delta(cur.leads, prev.leads),
    qualified: delta(cur.qualifiedPct, prev.qualifiedPct, " pts"),
    booked: delta(cur.callsBooked, prev.callsBooked),
  };

  return (
    <div className="flex-1 overflow-y-auto print:overflow-visible">
      <PageHeader
        title="Weekly report"
        description={`Uluwatu Paradise · ${new Date(from).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TEAM_TZ })} – ${new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TEAM_TZ })} · for the founder and sales team`}
        actions={
          <div className="no-print flex items-center gap-2">
            <Segmented
              value={String(period) as "7" | "14" | "30"}
              onChange={(v) => setPeriod(Number(v) as Period)}
              items={[
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
              ]}
            />
            <Button onClick={() => window.print()}>
              <Printer /> Print / PDF
            </Button>
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
          <Stat icon={Users} label="New leads" value={cur.leads} delta={d.leads.text} good={d.leads.good} />
          <Stat icon={Zap} label="Median first reply" value={duration(cur.medianFirstResponseMs)} target="< 1 min" good={cur.medianFirstResponseMs < 60_000} delta={cur.medianFirstResponseMs < 60_000 ? "On target" : "Above target"} />
          <Stat icon={Target} label="Qualified rate" value={`${cur.qualifiedPct.toFixed(0)}%`} delta={d.qualified.text} good={d.qualified.good} />
          <Stat icon={CalendarCheck} label="Calls booked" value={cur.callsBooked} delta={d.booked.text} good={d.booked.good} />
          <Stat label="Resolved without human" value={`${cur.resolvedWithoutHumanPct.toFixed(0)}%`} target="≥ 60%" good={cur.resolvedWithoutHumanPct >= 60} delta={cur.resolvedWithoutHumanPct >= 60 ? "On target" : "Below target"} />
          <Stat icon={Moon} label="Arrived after hours" value={`${cur.afterHoursPct.toFixed(0)}%`} delta="Outside 09:00–18:00 WITA" />
          <Stat
            icon={Flag}
            label="Flagged wrong in QA"
            value={qa.wrongPct === undefined ? "—" : `${qa.wrongPct.toFixed(1)}%`}
            target={`< ${QA_TARGET_PCT}%`}
            good={qa.wrongPct === undefined ? undefined : qa.wrongPct < QA_TARGET_PCT}
            delta={`${qa.reviewed} answers reviewed`}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader title="New leads per day" description="Hover a bar for the Hot count" />
            <CardBody>
              <Columns data={daily} />
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-ink-subtle">Show as table</summary>
                <table className="mt-2 w-full">
                  <tbody>
                    {daily.map((r) => (
                      <tr key={r.label} className="border-t border-line">
                        <td className="py-1 text-ink-muted">{r.label}</td>
                        <td className="py-1 text-right tabular-nums">{r.value}</td>
                        <td className="py-1 pl-3 text-ink-subtle">{r.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Funnel" description="Leads that reached each stage (excluding lost)" />
            <CardBody>
              <HBars data={funnel} />
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="By source" description={`${cur.attributionPct.toFixed(0)}% attributed · target ≥ 95%`} />
            <CardBody>
              <HBars data={bySource} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="By language" />
            <CardBody>
              <HBars data={byLanguage} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Top questions" description="Topics the concierge answered" />
            <CardBody>
              <HBars data={topics} />
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Unanswered questions" description="Candidates for new KB articles" />
            {unanswered.length ? (
              <ul className="divide-y divide-line">
                {unanswered.map(({ q, lead }, i) => (
                  <li key={i} className="flex gap-2 px-4 py-2.5 text-sm">
                    <CircleHelp className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    <span className="min-w-0">
                      {q}
                      <Link href={`/leads/${lead.id}`} className="block text-2xs text-ink-subtle hover:underline">
                        {lead.name}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardBody className="text-xs text-ink-subtle">None this period.</CardBody>
            )}
          </Card>
          <Card>
            <CardHeader title="Lost reasons" />
            <CardBody>
              <HBars data={lostReasons} empty="No lost leads this period" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Advisors" description="Leads created this period" />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-2xs text-ink-subtle uppercase [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                  <th>Advisor</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Calls</th>
                  <th className="text-right">Takeovers</th>
                </tr>
              </thead>
              <tbody>
                {advisors.map((a) => (
                  <tr key={a.id} className="border-t border-line tabular-nums [&>td]:px-4 [&>td]:py-2">
                    <td>
                      <span className="flex items-center gap-2">
                        <Avatar name={a.name} size="xs" /> {a.name.split(" ")[0]}
                      </span>
                    </td>
                    <td className="text-right">{inRange.filter((l) => l.advisorId === a.id).length}</td>
                    <td className="text-right">{inRange.filter((l) => l.booking?.advisorId === a.id).length}</td>
                    <td className="text-right">{takeovers.filter((t) => t.actor === a.name).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
