"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Download, Search, Users } from "lucide-react";
import { Avatar, Button, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { ChannelIcon, LangTag, ScoreBadge, StageBadge } from "@/components/domain";
import { cn } from "@/lib/cn";
import { BUDGETS, SOURCES, STAGES, TIMELINES } from "@/lib/labels";
import { relTime } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Lead, Score, Source, Stage } from "@/lib/types";

type SortKey = "name" | "score" | "stage" | "budget" | "lastMessageAt" | "createdAt";

const scoreRank: Record<Score, number> = { hot: 0, warm: 1, cold: 2 };
const budgetRank = (l: Lead) => (l.budget ? Object.keys(BUDGETS).indexOf(l.budget) : -1);
const stageRank = (l: Lead) => STAGES.findIndex((s) => s.value === l.stage);

const CSV_FIELDS: (keyof Lead)[] = [
  "name", "country", "language", "phone", "email", "channel", "source", "sourceDetail", "budget", "timeline",
  "purpose", "ownership", "financing", "score", "stage", "advisorId", "consent", "optedOut", "createdAt",
  "lastMessageAt", "nextFollowUp",
];

function toCsv(leads: Lead[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [CSV_FIELDS.join(","), ...leads.map((l) => CSV_FIELDS.map((f) => esc(l[f])).join(","))].join("\n");
}

type Sort = { key: SortKey; dir: 1 | -1 };

function Th({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k?: SortKey;
  sort: Sort;
  onSort: (s: Sort) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("sticky top-0 z-10 border-b border-line bg-subtle px-3 py-2 text-left text-2xs font-semibold tracking-wide text-ink-subtle uppercase", className)}>
      {k ? (
        <button
          className="inline-flex items-center gap-1 tracking-wide uppercase hover:text-ink"
          onClick={() => onSort({ key: k, dir: sort.key === k ? (-sort.dir as 1 | -1) : -1 })}
        >
          {children}
          {sort.key === k && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function LeadsTable() {
  const leads = useStore((s) => s.leads);
  const advisors = useStore((s) => s.advisors);
  const now = useNow();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<"" | Stage>("");
  const [score, setScore] = useState<"" | Score>("");
  const [source, setSource] = useState<"" | Source>("");
  const [sort, setSort] = useState<Sort>({ key: "lastMessageAt", dir: -1 });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cmp: Record<SortKey, (a: Lead, b: Lead) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      score: (a, b) => scoreRank[a.score] - scoreRank[b.score],
      stage: (a, b) => stageRank(a) - stageRank(b),
      budget: (a, b) => budgetRank(a) - budgetRank(b),
      lastMessageAt: (a, b) => Date.parse(a.lastMessageAt) - Date.parse(b.lastMessageAt),
      createdAt: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    };
    return leads
      .filter((l) => !needle || [l.name, l.country, l.email, l.phone].some((v) => v?.toLowerCase().includes(needle)))
      .filter((l) => !stage || l.stage === stage)
      .filter((l) => !score || l.score === score)
      .filter((l) => !source || l.source === source)
      .sort((a, b) => cmp[sort.key](a, b) * sort.dir);
  }, [leads, q, stage, score, source, sort]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ngh-leads.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Leads"
        description={`${rows.length} of ${leads.length} leads · every lead carries source attribution and consent status`}
        actions={
          <Button onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, country, contact…" className="pl-8" />
          </div>
          <Select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className="w-40" aria-label="Stage">
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select value={score} onChange={(e) => setScore(e.target.value as Score)} className="w-32" aria-label="Score">
            <option value="">All scores</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
          <Select value={source} onChange={(e) => setSource(e.target.value as Source)} className="w-40" aria-label="Source">
            <option value="">All sources</option>
            {Object.entries(SOURCES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-auto bg-surface">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No leads match" description="Try clearing a filter." />
        ) : (
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <Th sort={sort} onSort={setSort} k="name" className="pl-6">Lead</Th>
                <Th sort={sort} onSort={setSort} k="score">Score</Th>
                <Th sort={sort} onSort={setSort} k="stage">Stage</Th>
                <Th sort={sort} onSort={setSort} k="budget">Budget</Th>
                <Th sort={sort} onSort={setSort}>Timeline</Th>
                <Th sort={sort} onSort={setSort}>Source</Th>
                <Th sort={sort} onSort={setSort}>Advisor</Th>
                <Th sort={sort} onSort={setSort} k="lastMessageAt">Last activity</Th>
                <Th sort={sort} onSort={setSort}>Next step</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const advisor = advisors.find((a) => a.id === l.advisorId);
                return (
                  <tr key={l.id} onClick={() => router.push(`/leads/${l.id}`)} className="cursor-pointer hover:bg-subtle [&>td]:border-b [&>td]:border-line [&>td]:px-3 [&>td]:py-2.5">
                    <td className="pl-6!">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={l.name} size="sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            {l.name} <ChannelIcon channel={l.channel} /> <LangTag lang={l.language} />
                          </p>
                          <p className="text-xs text-ink-subtle">{l.country}</p>
                        </div>
                      </div>
                    </td>
                    <td><ScoreBadge score={l.score} /></td>
                    <td><StageBadge stage={l.stage} /></td>
                    <td className="text-ink-muted">{l.budget ? BUDGETS[l.budget] : "—"}</td>
                    <td className="text-ink-muted">{l.timeline ? TIMELINES[l.timeline] : "—"}</td>
                    <td className="text-ink-muted">{SOURCES[l.source]}</td>
                    <td>
                      {advisor ? (
                        <span className="flex items-center gap-1.5 text-ink-muted"><Avatar name={advisor.name} size="xs" /> {advisor.name.split(" ")[0]}</span>
                      ) : (
                        <span className="text-ink-subtle">Unassigned</span>
                      )}
                    </td>
                    <td className="text-ink-muted">{relTime(l.lastMessageAt, now)}</td>
                    <td className="text-xs text-ink-muted">
                      {l.optedOut ? (
                        <span className="text-danger">Opted out</span>
                      ) : l.booking && Date.parse(l.booking.at) > now ? (
                        <span className="text-info">Call {relTime(l.booking.at, now)}</span>
                      ) : l.nextFollowUp ? (
                        `Follow-up ${relTime(l.nextFollowUp, now)}`
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
