"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, Field, Input, Meter, PageHeader, Switch, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";
import { saveAdvisor, updateSettings } from "@/lib/actions";
import { BUDGETS, LANGUAGES, SCORES, TIMELINES } from "@/lib/labels";
import { scoreLead } from "@/lib/rules";
import { dateTime } from "@/lib/format";
import { resetDemo, useStore } from "@/lib/store";
import type { Budget, Language, ScoringRules, Timeline } from "@/lib/types";

function PointInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return <Input type="number" min={0} max={10} value={value} onChange={(e) => onChange(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className="w-16 text-center" />;
}

function Rules() {
  const settings = useStore((s) => s.settings);
  const leads = useStore((s) => s.leads);
  const [r, setR] = useState<ScoringRules>(settings.scoring);
  const [autoHot, setAutoHot] = useState(settings.autoHandoffOnHot);

  const preview = useMemo(() => {
    const now = { hot: 0, warm: 0, cold: 0 };
    const next = { hot: 0, warm: 0, cold: 0 };
    leads.forEach((l) => {
      now[l.score]++;
      next[scoreLead(l, r)]++;
    });
    return { now, next };
  }, [leads, r]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader title="Qualification scoring" description="Points per captured answer. NGH approves these rules in discovery (FR-07)." />
        <CardBody className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-muted">Budget</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(BUDGETS) as Budget[]).map((b) => (
                <label key={b} className="flex items-center justify-between gap-2 rounded-sm border border-line px-2.5 py-1.5 text-sm">
                  {BUDGETS[b]}
                  <PointInput value={r.budget[b]} onChange={(n) => setR({ ...r, budget: { ...r.budget, [b]: n } })} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-ink-muted">Timeline</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(TIMELINES) as Timeline[]).map((t) => (
                <label key={t} className="flex items-center justify-between gap-2 rounded-sm border border-line px-2.5 py-1.5 text-sm">
                  {TIMELINES[t]}
                  <PointInput value={r.timeline[t]} onChange={(n) => setR({ ...r, timeline: { ...r.timeline, [t]: n } })} />
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["cashBuyer", "Cash buyer"],
                ["contactShared", "Shared email or phone"],
                ["purposeKnown", "Purpose stated"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-2 rounded-sm border border-line px-2.5 py-1.5 text-sm">
                {label}
                <PointInput value={r[k]} onChange={(n) => setR({ ...r, [k]: n })} />
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Hot at (points ≥)">
              <Input type="number" value={r.hotAt} onChange={(e) => setR({ ...r, hotAt: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Warm at (points ≥)">
              <Input type="number" value={r.warmAt} onChange={(e) => setR({ ...r, warmAt: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          {r.warmAt >= r.hotAt && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="size-3.5" /> Warm threshold must be below Hot.
            </p>
          )}
          <label className="flex items-center gap-2.5 text-sm">
            <Switch checked={autoHot} onChange={setAutoHot} label="Auto handoff" />
            Hand Hot leads to an advisor instantly (FR-13)
          </label>
          <div className="flex justify-end">
            <Button variant="primary" disabled={r.warmAt >= r.hotAt} onClick={() => updateSettings({ scoring: r, autoHandoffOnHot: autoHot })}>
              <Save /> Save & re-score leads
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="self-start">
        <CardHeader title="Impact preview" description="Current leads under these rules" />
        <CardBody className="space-y-3">
          {(["hot", "warm", "cold"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <Badge tone={SCORES[k].tone} dot>
                {SCORES[k].label}
              </Badge>
              <span className="tabular-nums">
                {preview.now[k]} → <b className="font-semibold">{preview.next[k]}</b>
              </span>
            </div>
          ))}
          <p className="text-2xs text-ink-subtle">Qualified = purpose, budget and timeline known and not Cold.</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Team() {
  const advisors = useStore((s) => s.advisors);
  const leads = useStore((s) => s.leads);
  return (
    <Card>
      <CardHeader title="Advisors & routing" description="Leads route by language, then project, then score — Hot leads go to a senior advisor first (FR-12)." />
      <ul className="divide-y divide-line">
        {advisors.map((a) => {
          const open = leads.filter((l) => l.advisorId === a.id && l.stage !== "won" && l.stage !== "lost").length;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <Avatar name={a.name} />
              <div className="w-44">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-ink-muted">
                  {a.title}
                  {a.role === "admin" && " · admin"}
                </p>
              </div>
              <div className="flex flex-1 flex-wrap gap-1">
                {(Object.keys(LANGUAGES) as Language[]).map((l) => {
                  const on = a.languages.includes(l);
                  return (
                    <button
                      key={l}
                      disabled={a.role !== "advisor"}
                      onClick={() => saveAdvisor({ ...a, languages: on ? a.languages.filter((x) => x !== l) : [...a.languages, l] })}
                      className={cn(
                        "h-6 rounded-xs border px-1.5 font-mono text-2xs font-medium transition-colors disabled:opacity-40",
                        on ? "border-accent/30 bg-accent-soft text-accent-ink" : "border-line text-ink-subtle hover:bg-subtle",
                      )}
                      title={LANGUAGES[l].label}
                    >
                      {LANGUAGES[l].flag}
                    </button>
                  );
                })}
              </div>
              {a.role === "advisor" && (
                <>
                  <label className="flex items-center gap-2 text-xs text-ink-muted">
                    <Switch checked={a.senior} onChange={(v) => saveAdvisor({ ...a, senior: v })} label="Senior" /> Takes Hot leads first
                  </label>
                  <span className="w-20 text-right text-xs text-ink-subtle">{open} open leads</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Costs() {
  const s = useStore((x) => x.settings);
  const [cap, setCap] = useState(s.costCapUsd);
  const [alert, setAlert] = useState(s.alertAtPct);
  const pct = (s.costSpentUsd / s.costCapUsd) * 100;
  return (
    <Card className="max-w-2xl">
      <CardHeader title="Monthly cost cap" description="AI and WhatsApp messaging costs, billed to NGH's own accounts at cost" />
      <CardBody className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums">${s.costSpentUsd}</span>
          <span className="text-sm text-ink-muted">of ${s.costCapUsd} this month · {pct.toFixed(0)}%</span>
        </div>
        <Meter value={pct} tone={pct >= 100 ? "danger" : pct >= s.alertAtPct ? "warning" : "accent"} />
        {pct >= s.alertAtPct && (
          <p className="flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle className="size-3.5" /> Above the {s.alertAtPct}% alert threshold — in production this alerts the founder and technical owner.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly cap (USD)">
            <Input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Alert at (% of cap)">
            <Input type="number" value={alert} onChange={(e) => setAlert(Math.min(100, Number(e.target.value) || 0))} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => updateSettings({ costCapUsd: cap, alertAtPct: alert })}>
            <Save /> Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Compliance() {
  const s = useStore((x) => x.settings);
  const [retention, setRetention] = useState(s.retentionMonths);
  const [privacy, setPrivacy] = useState(s.privacyUrl);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Data protection" description="PDP Law No. 27/2022 and GDPR basics" />
        <CardBody className="space-y-4">
          <Field label="Retention period (months)" hint="Lead data older than this is deleted unless the lead is active.">
            <Input type="number" value={retention} onChange={(e) => setRetention(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Privacy notice URL" hint="Linked in the consent message before any details are stored.">
            <Input value={privacy} onChange={(e) => setPrivacy(e.target.value)} />
          </Field>
          <ul className="space-y-1.5 text-xs text-ink-muted">
            <li>✓ Consent captured before storing details</li>
            <li>✓ AI disclosure and “talk to a person” in every conversation</li>
            <li>✓ Export and delete on request from each lead profile</li>
            <li>✓ Opt-out stops all automated messages</li>
          </ul>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => updateSettings({ retentionMonths: retention, privacyUrl: privacy })}>
              <Save /> Save
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="self-start">
        <CardHeader title="Demo data" description="This prototype stores data in your browser" />
        <CardBody className="space-y-3">
          <p className="text-xs text-ink-muted">
            In production the CRM holds this data in NGH-owned accounts. Resetting restores the sample leads, knowledge base and settings.
          </p>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        </CardBody>
      </Card>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset demo data?"
        description="All leads, conversations and edits made in this browser are replaced with the sample data."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo();
                setConfirm(false);
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">This can&apos;t be undone.</p>
      </Dialog>
    </div>
  );
}

function Audit() {
  const audit = useStore((s) => s.audit);
  const leads = useStore((s) => s.leads);
  return (
    <Card>
      <CardHeader title="Audit log" description="Takeovers, stage changes, assignments, deletions and settings changes" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-subtle text-left text-2xs font-semibold tracking-wide text-ink-subtle uppercase [&>th]:px-4 [&>th]:py-2">
            <th>When (WITA)</th>
            <th>Who</th>
            <th>Action</th>
            <th>Lead</th>
          </tr>
        </thead>
        <tbody>
          {audit.map((a) => {
            const lead = leads.find((l) => l.id === a.leadId);
            return (
              <tr key={a.id} className="border-b border-line [&>td]:px-4 [&>td]:py-2">
                <td className="whitespace-nowrap text-ink-muted tabular-nums">{dateTime(a.at)}</td>
                <td>{a.actor}</td>
                <td>{a.action}</td>
                <td>
                  {lead ? (
                    <Link href={`/leads/${lead.id}`} className="text-accent hover:underline">
                      {lead.name}
                    </Link>
                  ) : (
                    <span className="text-ink-subtle">{a.leadId ? "Deleted" : "—"}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState<"rules" | "team" | "costs" | "compliance" | "audit">("rules");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Settings" description="Rules and guardrails NGH approves. Changes are recorded in the audit log.">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "rules", label: "Qualification" },
            { value: "team", label: "Team & routing" },
            { value: "costs", label: "Cost control" },
            { value: "compliance", label: "Data & compliance" },
            { value: "audit", label: "Audit log" },
          ]}
        />
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {tab === "rules" && <Rules />}
        {tab === "team" && <Team />}
        {tab === "costs" && <Costs />}
        {tab === "compliance" && <Compliance />}
        {tab === "audit" && <Audit />}
      </div>
    </div>
  );
}
