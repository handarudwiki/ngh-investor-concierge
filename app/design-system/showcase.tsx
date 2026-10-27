"use client";

import { useState, type ReactNode } from "react";
import { Calendar, Inbox, MessageCircle, Plus, Search, Send, UserRound, Zap } from "lucide-react";
import {
  Avatar,
  Badge,
  BotAvatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Count,
  Dialog,
  EmptyState,
  Field,
  Input,
  Kbd,
  Meter,
  PageHeader,
  Segmented,
  Select,
  Stat,
  Switch,
  Tabs,
  Textarea,
} from "@/components/ui";

const colors: { group: string; tokens: string[] }[] = [
  { group: "Surfaces", tokens: ["canvas", "surface", "subtle", "muted", "sidebar"] },
  { group: "Ink & lines", tokens: ["ink", "ink-muted", "ink-subtle", "line", "line-strong"] },
  { group: "Accent", tokens: ["accent", "accent-hover", "accent-soft", "accent-ink"] },
  {
    group: "Status",
    tokens: ["success", "warning", "danger", "info", "success-soft", "warning-soft", "danger-soft", "info-soft"],
  },
  { group: "Lead score", tokens: ["hot", "warm", "cold", "hot-soft", "warm-soft", "cold-soft"] },
  { group: "Channels", tokens: ["whatsapp", "web"] },
];

const type: { cls: string; label: string }[] = [
  { cls: "text-3xl font-display", label: "Display · 36 Instrument Serif" },
  { cls: "text-2xl font-semibold tracking-tight", label: "KPI · 26 semibold" },
  { cls: "text-xl font-semibold tracking-tight", label: "Page title · 20 semibold" },
  { cls: "text-lg font-semibold", label: "Section · 16 semibold" },
  { cls: "text-base", label: "Body · 14 — messages, long copy" },
  { cls: "text-sm", label: "UI · 13 — default for lists, controls" },
  { cls: "text-xs text-ink-muted", label: "Caption · 12 — labels, meta" },
  { cls: "text-2xs text-ink-subtle", label: "Micro · 11 — timestamps, counters" },
];

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-line py-8 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Showcase() {
  const [tab, setTab] = useState<"open" | "mine" | "done">("open");
  const [view, setView] = useState<"board" | "list">("board");
  const [on, setOn] = useState(true);
  const [dialog, setDialog] = useState(false);

  return (
    <div className="min-h-full bg-canvas">
      <PageHeader
        title="Design system"
        description="Tokens and components for the NGH Concierge workspace. Inspired by Front: neutral, dense, calm — one accent."
      />
      <main className="mx-auto max-w-5xl px-6">
        <Section title="Principles" description="What every screen should feel like.">
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Inbox-first", "Panes, not pages. List → thread → context, like an email client."],
              ["Calm density", "13px UI text, 32px controls, hairline borders, very little shadow."],
              ["One accent", "Lagoon teal marks action and selection. Colour elsewhere carries meaning only."],
              ["Brand-safe", "Indicative figures always labelled; AI messages always identifiable."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-md border border-line bg-surface p-3">
                <p className="font-semibold">{t}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{d}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Colour" description="Use tokens via Tailwind utilities: bg-surface, text-ink-muted, border-line…">
          <div className="space-y-5">
            {colors.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-xs font-medium text-ink-muted">{g.group}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {g.tokens.map((t) => (
                    <div key={t} className="overflow-hidden rounded-sm border border-line bg-surface">
                      <div className="h-10" style={{ background: `var(--color-${t})` }} />
                      <p className="px-2 py-1.5 font-mono text-2xs text-ink-muted">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" description="Inter for UI (Latin + Cyrillic for Russian leads). Instrument Serif for brand moments only.">
          <div className="space-y-3">
            {type.map((t) => (
              <div key={t.label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-line pb-2">
                <span className={t.cls}>Uluwatu Paradise</span>
                <span className="shrink-0 font-mono text-2xs text-ink-subtle">{t.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons" description="Primary once per view. Secondary for everything else. Ghost in toolbars.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary"><Send /> Send reply</Button>
              <Button><Calendar /> Book call</Button>
              <Button variant="subtle">Subtle</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Opt out</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="primary"><Plus /> Small</Button>
              <Button size="xs">Extra small</Button>
              <Button icon aria-label="Search"><Search /></Button>
              <Button icon size="sm" variant="ghost" aria-label="Inbox"><Inbox /></Button>
            </div>
          </div>
        </Section>

        <Section title="Badges" description="Status, score and channel. Dots for state, plain for categories.">
          <div className="flex flex-wrap gap-2">
            <Badge tone="hot" dot>Hot</Badge>
            <Badge tone="warm" dot>Warm</Badge>
            <Badge tone="cold" dot>Cold</Badge>
            <Badge tone="accent">Qualified</Badge>
            <Badge tone="success">Won</Badge>
            <Badge tone="warning">Needs human</Badge>
            <Badge tone="danger">Opted out</Badge>
            <Badge tone="info"><MessageCircle /> Website</Badge>
            <Badge>NL</Badge>
            <Count>12</Count>
            <Count active>3</Count>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </Section>

        <Section title="Avatars" description="Initials with a stable colour per person. The concierge always uses the accent mark.">
          <div className="flex items-center gap-3">
            <BotAvatar size="lg" />
            <Avatar name="Pieter de Vries" size="lg" />
            <Avatar name="Anna Volkova" />
            <Avatar name="Carlos Ruiz" size="sm" />
            <Avatar name="Made Wijaya" size="xs" />
            <div className="flex -space-x-1.5">
              {["Sari Dewi", "Mitchell K", "Lucas B"].map((n) => (
                <Avatar key={n} name={n} size="sm" ring />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Forms" description="32px controls, label above, hint below. Focus ring uses the accent at 15%.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lead name"><Input placeholder="e.g. Pieter de Vries" /></Field>
            <Field label="Budget range" hint="Captured by the concierge (FR-06)">
              <Select defaultValue="b">
                <option value="a">Under $250k</option>
                <option value="b">$250k – $500k</option>
                <option value="c">$500k – $1M</option>
              </Select>
            </Field>
            <Field label="Internal note" className="sm:col-span-2">
              <Textarea placeholder="Only visible to advisors" />
            </Field>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={on} onChange={setOn} label="Automations" /> Automated follow-ups
            </div>
          </div>
        </Section>

        <Section title="Navigation" description="Tabs under page headers; segmented control for view toggles.">
          <div className="space-y-4">
            <div className="border-b border-line">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { value: "open", label: "Open", count: 14 },
                  { value: "mine", label: "Assigned to me", count: 5 },
                  { value: "done", label: "Done" },
                ]}
              />
            </div>
            <Segmented
              value={view}
              onChange={setView}
              items={[
                { value: "board", label: "Board" },
                { value: "list", label: "List" },
              ]}
            />
          </div>
        </Section>

        <Section title="Cards & data" description="Cards group related content. KPI tiles always show target.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Median first reply" value="38s" target="< 1 min" delta="▼ 4h 12m vs baseline" good icon={Zap} />
            <Stat label="Resolved without human" value="64%" target="≥ 60%" delta="▲ 6 pts" good />
            <Stat label="Qualified calls booked" value="23" target="+30%" delta="▲ 21%" good={false} />
            <Card className="sm:col-span-3">
              <CardHeader
                title="Monthly AI & messaging cost"
                description="Alerts at 80% of cap"
                actions={<Button size="sm" variant="ghost">Edit cap</Button>}
              />
              <CardBody className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">$164 of $250</span>
                  <span className="font-medium">66%</span>
                </div>
                <Meter value={66} />
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section title="Feedback" description="Empty states explain what will appear. Dialogs for focused decisions.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <EmptyState
                icon={UserRound}
                title="No conversation selected"
                description="Pick a conversation from the list to see the thread and lead profile."
              />
            </Card>
            <Card className="flex items-center justify-center p-6">
              <Button variant="primary" onClick={() => setDialog(true)}>Open dialog</Button>
            </Card>
          </div>
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="Take over conversation?"
            description="The concierge will stop replying and all automated messages will pause (FR-17)."
            footer={
              <>
                <Button onClick={() => setDialog(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setDialog(false)}>Take over</Button>
              </>
            }
          >
            <p className="text-sm text-ink-muted">The takeover is recorded in the audit log.</p>
          </Dialog>
        </Section>
      </main>
    </div>
  );
}
