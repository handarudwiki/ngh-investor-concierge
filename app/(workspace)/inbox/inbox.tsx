"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Flame,
  Globe,
  Hand,
  Inbox as InboxIcon,
  MessageCircle,
  MessagesSquare,
  Search,
  Star,
  UserRound,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Count, EmptyState, Input } from "@/components/ui";
import { ChannelIcon, LangTag, ScoreBadge } from "@/components/domain";
import { LeadSummary } from "@/components/lead/summary";
import { Thread } from "@/components/lead/thread";
import { Composer, ThreadHeader } from "./conversation";
import { cn } from "@/lib/cn";
import { markRead } from "@/lib/actions";
import { relTime } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";

type ViewKey = "open" | "mine" | "escalated" | "hot" | "unassigned" | "human" | "starred" | "whatsapp" | "web" | "closed";

const views: { group: string; items: { key: ViewKey; label: string; icon: LucideIcon }[] }[] = [
  {
    group: "Inbox",
    items: [
      { key: "open", label: "All open", icon: InboxIcon },
      { key: "mine", label: "Assigned to me", icon: UserRound },
      { key: "escalated", label: "Needs human", icon: AlertTriangle },
      { key: "hot", label: "Hot leads", icon: Flame },
      { key: "unassigned", label: "Unassigned", icon: UserX },
      { key: "starred", label: "Starred", icon: Star },
    ],
  },
  {
    group: "Handled by",
    items: [{ key: "human", label: "Advisors", icon: Hand }],
  },
  {
    group: "Channels",
    items: [
      { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
      { key: "web", label: "Website chat", icon: Globe },
    ],
  },
  { group: "Archive", items: [{ key: "closed", label: "Won, lost & opted out", icon: MessagesSquare }] },
];

function matches(view: ViewKey, l: Lead, me: string) {
  const open = l.stage !== "won" && l.stage !== "lost" && !l.optedOut;
  switch (view) {
    case "open":
      return open;
    case "mine":
      return open && l.advisorId === me;
    case "escalated":
      return open && Boolean(l.escalation);
    case "hot":
      return open && l.score === "hot";
    case "unassigned":
      return open && !l.advisorId;
    case "starred":
      return Boolean(l.starred);
    case "human":
      return open && l.mode === "human";
    case "whatsapp":
    case "web":
      return open && l.channel === view;
    case "closed":
      return !open;
  }
}

function preview(l: Lead) {
  const last = [...l.messages].reverse().find((m) => m.author !== "system");
  if (!last) return "";
  const who = last.author === "bot" ? "Concierge: " : last.author === "advisor" ? (last.internal ? "Note: " : "You: ") : "";
  return who + last.text;
}

export function Inbox() {
  const leads = useStore((s) => s.leads);
  const me = useStore((s) => s.me);
  const now = useNow();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<ViewKey>("open");
  const [q, setQ] = useState("");

  const selectedId = params.get("c");
  const select = (id: string) => router.replace(`${pathname}?c=${id}`, { scroll: false });

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads
      .filter((l) => matches(view, l, me))
      .filter(
        (l) =>
          !needle ||
          l.name.toLowerCase().includes(needle) ||
          l.country.toLowerCase().includes(needle) ||
          l.messages.some((m) => m.text.toLowerCase().includes(needle)),
      )
      .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
  }, [leads, view, me, q]);

  const counts = useMemo(() => {
    const c = {} as Record<ViewKey, number>;
    views.forEach((g) => g.items.forEach((i) => (c[i.key] = leads.filter((l) => matches(i.key, l, me) && l.unread > 0).length)));
    return c;
  }, [leads, me]);

  const selected = leads.find((l) => l.id === selectedId) ?? (selectedId ? undefined : list[0]);

  useEffect(() => {
    if (selected && selected.unread > 0) markRead(selected.id);
  }, [selected]);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Views */}
      <aside className="hidden w-52 shrink-0 flex-col overflow-y-auto border-r border-line bg-canvas py-3 xl:flex">
        {views.map((g) => (
          <div key={g.group} className="mb-4 px-2">
            <p className="px-2 pb-1 text-2xs font-semibold tracking-wide text-ink-subtle uppercase">{g.group}</p>
            {g.items.map((i) => (
              <button
                key={i.key}
                onClick={() => setView(i.key)}
                className={cn(
                  "flex h-7 w-full items-center gap-2 rounded-sm px-2 text-sm transition-colors",
                  view === i.key ? "bg-surface font-medium text-ink shadow-xs" : "text-ink-muted hover:bg-subtle hover:text-ink",
                )}
              >
                <i.icon className={cn("size-3.5", i.key === "escalated" && counts.escalated && "text-warning")} />
                <span className="flex-1 text-left">{i.label}</span>
                {counts[i.key] > 0 && <Count active={view === i.key}>{counts[i.key]}</Count>}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Conversation list */}
      <section className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
        <div className="space-y-2 border-b border-line p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{views.flatMap((g) => g.items).find((i) => i.key === view)?.label}</h1>
            <span className="text-xs text-ink-subtle">{list.length}</span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, country, message…" className="pl-8" />
          </div>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as ViewKey)}
            className="h-7 w-full rounded-sm border border-line bg-surface px-2 text-xs xl:hidden"
            aria-label="View"
          >
            {views.flatMap((g) => g.items).map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.length === 0 && <EmptyState icon={InboxIcon} title="Nothing here" description="No conversations match this view." />}
          {list.map((l) => {
            const active = l.id === selected?.id;
            return (
              <li key={l.id}>
                <button
                  onClick={() => select(l.id)}
                  className={cn(
                    "relative flex w-full gap-2.5 border-b border-line px-3 py-3 text-left transition-colors",
                    active ? "bg-accent-soft/60" : "hover:bg-subtle",
                  )}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
                  <Avatar name={l.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("truncate text-sm", l.unread ? "font-semibold" : "font-medium")}>{l.name}</span>
                      <ChannelIcon channel={l.channel} className="shrink-0" />
                      <LangTag lang={l.language} />
                      <span className="ml-auto shrink-0 text-2xs text-ink-subtle">{relTime(l.lastMessageAt, now)}</span>
                    </div>
                    <p className={cn("mt-0.5 line-clamp-2 text-xs", l.unread ? "text-ink" : "text-ink-muted")}>{preview(l)}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <ScoreBadge score={l.score} />
                      {l.escalation && (
                        <span className="inline-flex items-center gap-1 text-2xs font-medium text-warning">
                          <AlertTriangle className="size-3" /> Needs human
                        </span>
                      )}
                      {l.mode === "bot" && !l.escalation && !l.optedOut && (
                        <span className="inline-flex items-center gap-1 text-2xs text-ink-subtle">
                          <Bot className="size-3" /> Concierge
                        </span>
                      )}
                      {l.starred && <Star className="size-3 fill-warning text-warning" />}
                      {l.unread > 0 && <span className="ml-auto size-2 rounded-full bg-accent" />}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Thread */}
      {selected ? (
        <>
          <section className="flex min-w-0 flex-1 flex-col bg-canvas">
            <ThreadHeader lead={selected} />
            <div className="flex-1 overflow-y-auto">
              <Thread lead={selected} />
            </div>
            <Composer key={selected.id} lead={selected} />
          </section>
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-surface lg:block">
            <LeadSummary lead={selected} />
          </aside>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-canvas">
          <EmptyState icon={MessagesSquare} title="No conversation selected" description="Pick a conversation to see the thread and lead profile." />
        </div>
      )}
    </div>
  );
}
