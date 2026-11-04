"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Cpu, ExternalLink, Globe, MessageCircle, RotateCcw } from "lucide-react";
import { Badge, Button, buttonStyles, Card, CardBody, CardHeader, Field, Segmented, Select } from "@/components/ui";
import { ScoreBadge, StageBadge } from "@/components/domain";
import { ChatWidget, type Visitor } from "@/components/widget/chat-widget";
import { BUDGETS, PURPOSES, TIMELINES } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Channel } from "@/lib/types";

const PERSONAS: (Visitor & { label: string; tries: string[] })[] = [
  {
    label: "Dutch investor · Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    language: "nl",
    page: "uluwatuparadise.com/nl/villas",
    tries: ["Hoe werkt leasehold voor Nederlanders?", "Ik wil verhuren, budget rond 600k contant, binnen 3 maanden", "Kunnen jullie de plattegrond sturen?"],
  },
  {
    label: "Russian buyer · Dubai",
    country: "Russia",
    timezone: "Asia/Dubai",
    language: "ru",
    page: "uluwatuparadise.com/ru",
    tries: ["Сколько стоит вилла с 3 спальнями?", "Возможна ли скидка?", "Как инвестицию, бюджет 700 тыс, оплата наличными, в течение полугода"],
  },
  {
    label: "Spanish couple · Madrid",
    country: "Spain",
    timezone: "Europe/Madrid",
    language: "es",
    page: "nghpropertygroup.com/es",
    tries: ["¿Cómo funciona el plan de pagos?", "Queremos vivir allí, presupuesto 450 mil, el próximo año", "¿Pagan impuestos en España?"],
  },
  {
    label: "Australian investor · Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    language: "en",
    page: "nghpropertygroup.com/investor-programme",
    tries: ["What are the rental yields?", "I want to rent it out, budget about 450k cash, ready within 3 months", "Can I speak to a person?"],
  },
  {
    label: "Indonesian buyer · Jakarta",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    language: "id",
    page: "nghpropertygroup.com/id",
    tries: ["Berapa harga unit termurah?", "Untuk disewakan, budget 300 ribu dolar, pakai KPR, tahun depan", "Apakah bisa kunjungan ke lokasi?"],
  },
];

const KEY = "ngh-widget-lead";

export function WidgetPreview() {
  const [channel, setChannel] = useState<Channel>("web");
  const [persona, setPersona] = useState(0);
  const [leadIds, setLeadIds] = useState<Record<string, string>>({});
  const [engine, setEngine] = useState<string>();
  // Bumped by "New conversation" to remount the widget with fresh state.
  const [session, setSession] = useState(0);
  const visitor = PERSONAS[persona];
  const key = `${channel}:${persona}`;
  const leadId = leadIds[key];
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const advisors = useStore((s) => s.advisors);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once after hydration
      if (saved) setLeadIds(JSON.parse(saved));
    } catch {}
    fetch("/api/concierge")
      .then((r) => r.json())
      .then((d) => setEngine(d.engine))
      .catch(() => setEngine("unavailable"));
  }, []);

  const remember = (id: string) => {
    const next = { ...leadIds, [key]: id };
    setLeadIds(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const restart = () => {
    const next = { ...leadIds };
    delete next[key];
    setLeadIds(next);
    setSession((n) => n + 1);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const advisor = advisors.find((a) => a.id === lead?.advisorId);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-6">
        <Link href="/inbox" className={buttonStyles({ variant: "ghost", size: "sm" })}>
          <ArrowLeft /> Workspace
        </Link>
        <span className="h-5 w-px bg-line" />
        <h1 className="text-base font-semibold">Concierge preview</h1>
        <span className="text-xs text-ink-muted">Chat as an investor; watch the lead appear in the advisor inbox.</span>
        <span className="ml-auto">
          {engine && (
            <Badge tone={engine === "claude" ? "accent" : "neutral"}>
              <Cpu /> {engine === "claude" ? "Claude engine" : engine === "rules" ? "Rules engine (no API key)" : "Engine unavailable"}
            </Badge>
          )}
        </span>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[320px_1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Simulate" description="Channel and visitor" />
            <CardBody className="space-y-4">
              <Segmented
                value={channel}
                onChange={setChannel}
                items={[
                  { value: "web", label: <span className="inline-flex items-center gap-1"><Globe className="size-3" /> Website</span> },
                  { value: "whatsapp", label: <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" /> WhatsApp</span> },
                ]}
              />
              <Field label="Visitor">
                <Select value={persona} onChange={(e) => setPersona(Number(e.target.value))}>
                  {PERSONAS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button size="sm" variant="ghost" onClick={restart}>
                <RotateCcw /> New conversation
              </Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Try saying" description="Example messages for this visitor" />
            <CardBody className="space-y-2">
              {visitor.tries.map((s) => (
                <p key={s} className="rounded-sm bg-subtle px-2.5 py-2 text-xs text-ink-muted select-all">
                  {s}
                </p>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="h-[680px]">
          <ChatWidget key={`${key}:${session}`} channel={channel} visitor={visitor} leadId={leadId} onLead={remember} />
        </div>

        <Card className="self-start">
          <CardHeader title="Live lead record" description="What the advisor sees" />
          {lead ? (
            <CardBody className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <ScoreBadge score={lead.score} />
                <StageBadge stage={lead.stage} />
                {lead.escalation && <Badge tone="warning">{lead.escalation}</Badge>}
              </div>
              <dl className="space-y-1.5 text-xs">
                {[
                  ["Language", lead.language.toUpperCase()],
                  ["Purpose", lead.purpose && PURPOSES[lead.purpose]],
                  ["Budget", lead.budget && BUDGETS[lead.budget]],
                  ["Timeline", lead.timeline && TIMELINES[lead.timeline]],
                  ["Financing", lead.financing],
                  ["Email", lead.email],
                  ["Advisor", advisor?.name],
                  ["Topics", lead.topics.join(", ")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-subtle">{k}</dt>
                    <dd className="truncate text-right font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/inbox?c=${lead.id}`} target="_blank" className={buttonStyles({ size: "sm", className: "w-full" })}>
                Open in inbox <ExternalLink />
              </Link>
            </CardBody>
          ) : (
            <CardBody className="flex items-center gap-2 text-xs text-ink-subtle">
              <Bot className="size-4" /> Send a message to create the lead.
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}
