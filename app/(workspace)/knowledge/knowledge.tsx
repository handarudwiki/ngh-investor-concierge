"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, CircleHelp, Plus, Save, Search, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
  Switch,
  Tabs,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { deleteKb, saveAssumptions, saveKb, saveUnit, uid } from "@/lib/actions";
import { LANGUAGES, usd } from "@/lib/labels";
import { scenarios } from "@/lib/rules";
import { dateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Assumptions, KbArticle, Language, Unit } from "@/lib/types";

const CATEGORIES: KbArticle["category"][] = ["project", "ownership", "process", "pricing", "investment", "visit", "company"];

function blankArticle(question = ""): KbArticle {
  return {
    id: uid("kb-"),
    category: "project",
    title: question || "New article",
    keywords: [],
    body: { en: "" },
    approved: false,
    owner: "Marketing",
    updatedAt: new Date().toISOString(),
  };
}

function ArticleEditor({ article, onDone }: { article: KbArticle; onDone: () => void }) {
  const [draft, setDraft] = useState(article);
  const [lang, setLang] = useState<Language>("en");
  const [keywords, setKeywords] = useState(article.keywords.join(", "));
  const set = (patch: Partial<KbArticle>) => setDraft((d) => ({ ...d, ...patch }));
  const legal = draft.category === "ownership";

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Title">
          <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Category">
          <Select value={draft.category} onChange={(e) => set({ category: e.target.value as KbArticle["category"] })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Keywords" hint="Comma-separated, in any language. The concierge uses them to find this article.">
        <Input
          value={keywords}
          onChange={(e) => {
            setKeywords(e.target.value);
            set({ keywords: e.target.value.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) });
          }}
        />
      </Field>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-muted">Approved answer</span>
          <Segmented
            value={lang}
            onChange={setLang}
            items={(Object.keys(LANGUAGES) as Language[]).map((l) => ({ value: l, label: `${LANGUAGES[l].flag}${draft.body[l] ? " ✓" : ""}` }))}
          />
        </div>
        <Textarea
          value={draft.body[lang] ?? ""}
          onChange={(e) => set({ body: { ...draft.body, [lang]: e.target.value || undefined } })}
          placeholder={`No ${LANGUAGES[lang].label} version — the concierge translates the English text (Claude engine) or shows it with a note (rules engine).`}
          className="min-h-36"
        />
      </div>
      <div className="grid gap-3 rounded-md border border-line bg-subtle/50 p-3 sm:grid-cols-2">
        <label className="flex items-start gap-2.5 text-sm">
          <Switch checked={draft.approved} onChange={(v) => set({ approved: v })} label="Approved" />
          <span>
            <span className="block font-medium">Approved for the concierge</span>
            <span className="text-xs text-ink-muted">
              {legal ? "Ownership wording needs the legal advisor's sign-off." : "Only approved articles are ever used in answers."}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm">
          <Switch checked={Boolean(draft.escalate)} onChange={(v) => set({ escalate: v })} label="Escalate" />
          <span>
            <span className="block font-medium">Hand off to an advisor</span>
            <span className="text-xs text-ink-muted">Answer generally, then route to a human (legal, tax, visas).</span>
          </span>
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Field label="Content owner" className="w-56">
          <Input value={draft.owner} onChange={(e) => set({ owner: e.target.value })} />
        </Field>
        <div className="flex gap-2 self-end">
          <Button
            variant="danger"
            onClick={() => {
              deleteKb(draft.id);
              onDone();
            }}
          >
            <Trash2 /> Delete
          </Button>
          <Button variant="primary" onClick={() => saveKb(draft)} disabled={!draft.title.trim() || !draft.body.en?.trim()}>
            <Save /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function Articles({ seed }: { seed?: KbArticle }) {
  const kb = useStore((s) => s.kb);
  const [selected, setSelected] = useState<string | undefined>(seed?.id ?? kb[0]?.id);
  const [draftNew, setDraftNew] = useState<KbArticle | undefined>(seed);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | KbArticle["category"]>("all");

  const list = useMemo(() => {
    const needle = q.toLowerCase();
    return kb
      .filter((k) => cat === "all" || k.category === cat)
      .filter((k) => !needle || k.title.toLowerCase().includes(needle) || k.keywords.some((w) => w.includes(needle)));
  }, [kb, q, cat]);

  const current = kb.find((k) => k.id === selected) ?? (draftNew?.id === selected ? draftNew : undefined);

  return (
    <Card className="grid min-h-[560px] overflow-hidden md:grid-cols-[300px_1fr]">
      <div className="flex flex-col border-r border-line">
        <div className="space-y-2 border-b border-line p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>
            <Button
              icon
              variant="primary"
              aria-label="New article"
              onClick={() => {
                const a = blankArticle();
                setDraftNew(a);
                setSelected(a.id);
              }}
            >
              <Plus />
            </Button>
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.map((k) => (
            <li key={k.id}>
              <button
                onClick={() => setSelected(k.id)}
                className={cn("w-full border-b border-line px-3 py-2.5 text-left", k.id === selected ? "bg-accent-soft/60" : "hover:bg-subtle")}
              >
                <p className="truncate text-sm font-medium">{k.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {k.approved ? (
                    <Badge tone="success"><ShieldCheck /> Approved</Badge>
                  ) : (
                    <Badge tone="warning"><ShieldAlert /> Draft</Badge>
                  )}
                  {k.escalate && <Badge tone="info">Hands off</Badge>}
                  <span className="ml-auto font-mono text-[10px] text-ink-subtle">{(Object.keys(k.body) as Language[]).map((l) => LANGUAGES[l].flag).join(" ")}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 overflow-y-auto">
        {current ? (
          <>
            <div className="border-b border-line px-5 py-3 text-2xs text-ink-subtle">
              {current.owner} · updated {dateTime(current.updatedAt)}
            </div>
            <ArticleEditor key={current.id} article={current} onDone={() => setSelected(kb[0]?.id)} />
          </>
        ) : (
          <EmptyState icon={BookOpen} title="Select an article" />
        )}
      </div>
    </Card>
  );
}

function Units() {
  const units = useStore((s) => s.units);
  return (
    <Card>
      <CardHeader title="Units & prices" description="Kept current by the financial manager. The concierge quotes only these." />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-subtle text-left text-2xs font-semibold tracking-wide text-ink-subtle uppercase [&>th]:px-4 [&>th]:py-2">
            <th>Unit</th>
            <th>Type</th>
            <th>Size</th>
            <th>Price (USD)</th>
            <th>Avg nightly rate</th>
            <th>Handover</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => {
            const set = (patch: Partial<Unit>) => saveUnit({ ...u, ...patch });
            return (
              <tr key={u.id} className="border-b border-line [&>td]:px-4 [&>td]:py-2">
                <td className="font-medium">{u.name}</td>
                <td className="text-ink-muted">{u.type} · {u.bedrooms} BR</td>
                <td className="text-ink-muted">{u.sizeSqm} m²</td>
                <td>
                  <Input type="number" defaultValue={u.priceUsd} onBlur={(e) => set({ priceUsd: Number(e.target.value) || u.priceUsd })} className="w-32" />
                </td>
                <td>
                  <Input type="number" defaultValue={u.adrUsd} onBlur={(e) => set({ adrUsd: Number(e.target.value) || u.adrUsd })} className="w-24" />
                </td>
                <td className="text-ink-muted">{u.handover}</td>
                <td>
                  <Select value={u.status} onChange={(e) => set({ status: e.target.value as Unit["status"] })} className="w-32">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </Select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function AssumptionsEditor() {
  const a = useStore((s) => s.assumptions);
  const units = useStore((s) => s.units);
  const [draft, setDraft] = useState<Assumptions>(a);
  const sample = units.find((u) => u.id === "u4") ?? units[0];
  const num = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader title="Scenario assumptions" description="Used for every indicative scenario in briefs (FR-09, FR-10)" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(["conservative", "base", "optimistic"] as const).map((k) => (
              <Field key={k} label={`${k[0].toUpperCase() + k.slice(1)} occupancy %`}>
                <Input type="number" value={draft.occupancy[k]} onChange={(e) => setDraft({ ...draft, occupancy: { ...draft.occupancy, [k]: num(e.target.value) } })} />
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Management fee % of revenue">
              <Input type="number" value={draft.managementFeePct} onChange={(e) => setDraft({ ...draft, managementFeePct: num(e.target.value) })} />
            </Field>
            <Field label="Operating costs % of revenue">
              <Input type="number" value={draft.operatingCostPct} onChange={(e) => setDraft({ ...draft, operatingCostPct: num(e.target.value) })} />
            </Field>
          </div>
          <Field label="Disclaimer shown with every scenario">
            <Textarea value={draft.disclaimer} onChange={(e) => setDraft({ ...draft, disclaimer: e.target.value })} />
          </Field>
          <Field label="Approved by">
            <Input value={draft.approvedBy} onChange={(e) => setDraft({ ...draft, approvedBy: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => saveAssumptions(draft)}>
              <Save /> Save assumptions
            </Button>
          </div>
        </CardBody>
      </Card>
      {sample && (
        <Card className="self-start">
          <CardHeader title="Preview" description={`${sample.name} · ${usd(sample.priceUsd)} · ${usd(sample.adrUsd)}/night`} />
          <CardBody className="space-y-2">
            {scenarios(sample, draft).map((s) => (
              <div key={s.key} className="flex justify-between text-sm">
                <span className="text-ink-muted">{s.label} · {s.occupancy}%</span>
                <span className="font-semibold tabular-nums">{s.netYieldPct.toFixed(1)}% net</span>
              </div>
            ))}
            <p className="pt-2 text-2xs text-warning">Indicative, not a guarantee.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Gaps({ onCreate }: { onCreate: (q: string) => void }) {
  const leads = useStore((s) => s.leads);
  const gaps = leads.flatMap((l) => (l.unanswered ?? []).map((q) => ({ q, lead: l })));
  return (
    <Card>
      <CardHeader title="Unanswered questions" description="The concierge said “I'll check with the team”. Turn recurring ones into approved articles." />
      {gaps.length === 0 ? (
        <EmptyState icon={CircleHelp} title="No gaps yet" description="Questions the knowledge base can't answer show up here." />
      ) : (
        <ul className="divide-y divide-line">
          {gaps.map(({ q, lead }, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <CircleHelp className="size-4 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{q}</p>
                <Link href={`/leads/${lead.id}`} className="text-xs text-ink-subtle hover:underline">
                  {lead.name}
                </Link>
              </div>
              <Button size="sm" onClick={() => onCreate(q)}>
                <Plus /> Create article
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Knowledge() {
  const kb = useStore((s) => s.kb);
  const gaps = useStore((s) => s.leads.reduce((n, l) => n + (l.unanswered?.length ?? 0), 0));
  const [tab, setTab] = useState<"articles" | "units" | "assumptions" | "gaps">("articles");
  const [seed, setSeed] = useState<KbArticle>();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Knowledge base"
        description="The concierge's single source of truth. It answers only from approved content."
        actions={<Badge tone="success"><ShieldCheck /> {kb.filter((k) => k.approved).length} of {kb.length} approved</Badge>}
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "articles", label: "Articles", count: kb.length },
            { value: "units", label: "Units & prices" },
            { value: "assumptions", label: "Scenario assumptions" },
            { value: "gaps", label: "Gaps", count: gaps },
          ]}
        />
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {tab === "articles" && <Articles key={seed?.id} seed={seed} />}
        {tab === "units" && <Units />}
        {tab === "assumptions" && <AssumptionsEditor />}
        {tab === "gaps" && (
          <Gaps
            onCreate={(q) => {
              setSeed(blankArticle(q));
              setTab("articles");
            }}
          />
        )}
      </div>
    </div>
  );
}
