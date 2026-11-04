"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, History, Inbox, Trash2, UserX } from "lucide-react";
import { Button, buttonStyles, Card, CardBody, CardHeader, Dialog, EmptyState, Field, Input, Select } from "@/components/ui";
import { LeadSummary } from "@/components/lead/summary";
import { Thread } from "@/components/lead/thread";
import { deleteLead, updateLead } from "@/lib/actions";
import { useCan } from "@/lib/permissions";
import { BUDGETS, FINANCING, LANGUAGES, OWNERSHIP, PURPOSES, TIMELINES } from "@/lib/labels";
import { dateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";

function Options({ map }: { map: Record<string, string> }) {
  return (
    <>
      <option value="">—</option>
      {Object.entries(map).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}

export function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lead = useStore((s) => s.leads.find((l) => l.id === id));
  const audit = useStore((s) => s.audit);
  const [erase, setErase] = useState(false);
  const canDelete = useCan("lead.delete");
  const history = useMemo(() => audit.filter((a) => a.leadId === id), [audit, id]);

  if (!lead) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={UserX}
          title="Lead not found"
          description="It may have been deleted on request."
          action={<Link href="/leads" className={buttonStyles()}>Back to leads</Link>}
        />
      </div>
    );
  }

  const set = <K extends keyof Lead>(key: K, value: Lead[K] | "") => updateLead(lead.id, { [key]: value || undefined } as Partial<Lead>);

  // PDP Law / GDPR: give the lead a copy of everything we hold.
  const exportData = () => {
    const blob = new Blob([JSON.stringify(lead, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lead-${lead.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-5">
        <Link href="/leads" className={buttonStyles({ variant: "ghost", size: "sm", icon: true })} aria-label="Back to leads">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg font-semibold">{lead.name}</h1>
        <div className="ml-auto flex gap-2">
          <Link href={`/inbox?c=${lead.id}`} className={buttonStyles({ size: "sm" })}>
            <Inbox /> Open conversation
          </Link>
          <Button size="sm" onClick={exportData}>
            <Download /> Export data
          </Button>
          {canDelete && (
            <Button size="sm" variant="danger" onClick={() => setErase(true)}>
              <Trash2 /> Delete on request
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="w-80 shrink-0 space-y-4 overflow-y-auto border-r border-line bg-canvas p-4">
          <Card key={lead.id}>
            <CardHeader title="Profile" description="Edits re-score the lead with the approved rules" />
            <CardBody className="space-y-3">
              <Field label="Name">
                <Input defaultValue={lead.name} onBlur={(e) => e.target.value.trim() && set("name", e.target.value.trim())} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country">
                  <Input defaultValue={lead.country} onBlur={(e) => set("country", e.target.value)} />
                </Field>
                <Field label="Language">
                  <Select value={lead.language} onChange={(e) => set("language", e.target.value as Lead["language"])}>
                    {Object.entries(LANGUAGES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" defaultValue={lead.email} onBlur={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input defaultValue={lead.phone} onBlur={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Budget">
                <Select value={lead.budget ?? ""} onChange={(e) => set("budget", e.target.value as Lead["budget"])}>
                  <Options map={BUDGETS} />
                </Select>
              </Field>
              <Field label="Timeline">
                <Select value={lead.timeline ?? ""} onChange={(e) => set("timeline", e.target.value as Lead["timeline"])}>
                  <Options map={TIMELINES} />
                </Select>
              </Field>
              <Field label="Purpose">
                <Select value={lead.purpose ?? ""} onChange={(e) => set("purpose", e.target.value as Lead["purpose"])}>
                  <Options map={PURPOSES} />
                </Select>
              </Field>
              <Field label="Ownership preference">
                <Select value={lead.ownership ?? ""} onChange={(e) => set("ownership", e.target.value as Lead["ownership"])}>
                  <Options map={OWNERSHIP} />
                </Select>
              </Field>
              <Field label="Financing">
                <Select value={lead.financing ?? ""} onChange={(e) => set("financing", e.target.value as Lead["financing"])}>
                  <Options map={FINANCING} />
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" description="Audit log entries for this lead" />
            {history.length === 0 ? (
              <EmptyState icon={History} title="No audited actions yet" className="py-6" />
            ) : (
              <ul className="divide-y divide-line">
                {history.map((h) => (
                  <li key={h.id} className="px-4 py-2.5 text-xs">
                    <p className="font-medium text-ink">{h.action}</p>
                    <p className="text-ink-subtle">
                      {h.actor} · {dateTime(h.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto bg-canvas">
          <Thread lead={lead} />
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-surface lg:block">
          <LeadSummary lead={lead} showProfileLink={false} />
        </aside>
      </div>

      <Dialog
        open={erase}
        onClose={() => setErase(false)}
        title="Delete this lead's data?"
        description="Use this when the lead asks for erasure (PDP Law No. 27/2022, GDPR). The record, transcript and brief are removed permanently; the deletion is logged."
        footer={
          <>
            <Button onClick={() => setErase(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteLead(lead.id);
                setErase(false);
                router.push("/leads");
              }}
            >
              <Trash2 /> Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">Consider exporting the data first if the lead also asked for a copy.</p>
      </Dialog>
    </div>
  );
}
