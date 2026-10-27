"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, FileText, Hand } from "lucide-react";
import { Avatar, Button, Dialog, Field, Input, PageHeader, Segmented } from "@/components/ui";
import { ChannelIcon, LangTag, ScoreBadge } from "@/components/domain";
import { cn } from "@/lib/cn";
import { setStage } from "@/lib/actions";
import { BUDGETS, STAGES } from "@/lib/labels";
import { relTime } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Lead, Score, Stage } from "@/lib/types";

const columnAccent: Record<Stage, string> = {
  new: "bg-ink-subtle",
  qualified: "bg-accent",
  call_booked: "bg-info",
  site_visit: "bg-info",
  reservation: "bg-warning",
  won: "bg-success",
  lost: "bg-danger",
};

function LeadCard({ lead, now, onDragStart }: { lead: Lead; now: number; onDragStart: () => void }) {
  const advisors = useStore((s) => s.advisors);
  const advisor = advisors.find((a) => a.id === lead.advisorId);
  return (
    <Link
      href={`/leads/${lead.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className="block cursor-grab rounded-md border border-line bg-surface p-3 shadow-xs transition-shadow hover:border-line-strong hover:shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium">{lead.name}</span>
        <ChannelIcon channel={lead.channel} className="shrink-0" />
        <LangTag lang={lead.language} />
      </div>
      <p className="mt-0.5 truncate text-xs text-ink-muted">
        {lead.country}
        {lead.budget && ` · ${BUDGETS[lead.budget]}`}
      </p>
      <div className="mt-2.5 flex items-center gap-1.5">
        <ScoreBadge score={lead.score} />
        {lead.escalation && <AlertTriangle className="size-3.5 text-warning" aria-label={lead.escalation} />}
        {lead.mode === "human" && <Hand className="size-3.5 text-info" aria-label="Advisor handling" />}
        {lead.booking && <CalendarCheck className="size-3.5 text-info" aria-label="Call booked" />}
        {lead.briefGeneratedAt && <FileText className="size-3.5 text-ink-subtle" aria-label="Brief generated" />}
        <span className="ml-auto text-2xs text-ink-subtle">{relTime(lead.lastMessageAt, now)}</span>
        {advisor ? <Avatar name={advisor.name} size="xs" /> : <span className="size-5 rounded-full border border-dashed border-line-strong" title="Unassigned" />}
      </div>
      {lead.stage === "lost" && lead.lostReason && <p className="mt-2 text-2xs text-danger">{lead.lostReason}</p>}
    </Link>
  );
}

export function Board() {
  const leads = useStore((s) => s.leads);
  const me = useStore((s) => s.me);
  const now = useNow();
  const [owner, setOwner] = useState<"all" | "mine">("all");
  const [score, setScore] = useState<"all" | Score>("all");
  const [dragging, setDragging] = useState<string>();
  const [over, setOver] = useState<Stage>();
  const [losing, setLosing] = useState<string>();
  const [reason, setReason] = useState("");

  const filtered = useMemo(
    () =>
      leads
        .filter((l) => owner === "all" || l.advisorId === me)
        .filter((l) => score === "all" || l.score === score)
        .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)),
    [leads, owner, score, me],
  );

  const drop = (stage: Stage, id: string) => {
    setOver(undefined);
    setDragging(undefined);
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    if (stage === "lost") {
      setLosing(id);
      return;
    }
    setStage(id, stage);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Pipeline"
        description="Drag leads between stages. Every change is logged on the lead."
        actions={
          <>
            <Segmented
              value={score}
              onChange={setScore}
              items={[
                { value: "all", label: "All scores" },
                { value: "hot", label: "Hot" },
                { value: "warm", label: "Warm" },
                { value: "cold", label: "Cold" },
              ]}
            />
            <Segmented
              value={owner}
              onChange={setOwner}
              items={[
                { value: "all", label: "Everyone" },
                { value: "mine", label: "Mine" },
              ]}
            />
          </>
        }
      />
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
        {STAGES.map((s) => {
          const items = filtered.filter((l) => l.stage === s.value);
          return (
            <section
              key={s.value}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s.value);
              }}
              onDragLeave={() => setOver((o) => (o === s.value ? undefined : o))}
              onDrop={(e) => drop(s.value, e.dataTransfer.getData("text/plain"))}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-lg border bg-subtle/60 transition-colors",
                over === s.value && dragging ? "border-accent bg-accent-soft/50" : "border-transparent",
              )}
            >
              <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span className={cn("size-2 rounded-full", columnAccent[s.value])} />
                <h2 className="text-sm font-semibold">{s.label}</h2>
                <span className="text-xs text-ink-subtle tabular-nums">{items.length}</span>
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} now={now} onDragStart={() => setDragging(l.id)} />
                ))}
                {items.length === 0 && (
                  <p className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-2xs text-ink-subtle">
                    Drop leads here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog
        open={Boolean(losing)}
        onClose={() => {
          setLosing(undefined);
          setReason("");
        }}
        title="Mark lead as lost"
        description="A reason helps the weekly report show why deals don't close."
        footer={
          <>
            <Button onClick={() => setLosing(undefined)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!reason.trim()}
              onClick={() => {
                setStage(losing!, "lost", reason.trim());
                setLosing(undefined);
                setReason("");
              }}
            >
              Mark as lost
            </Button>
          </>
        }
      >
        <Field label="Reason">
          <Input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Bought with another developer"
          />
        </Field>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Bought elsewhere", "Budget too low", "Timing", "Financing fell through", "Not responsive"].map((r) => (
            <button key={r} onClick={() => setReason(r)} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted hover:bg-subtle">
              {r}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
