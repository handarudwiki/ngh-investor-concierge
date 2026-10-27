"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Count } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useNow, useStore } from "@/lib/store";
import { switchUser } from "@/lib/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  attention?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const leads = useStore((s) => s.leads);
  const advisors = useStore((s) => s.advisors);
  const meId = useStore((s) => s.me);
  const now = useNow();
  const me = advisors.find((a) => a.id === meId)!;

  const counts = useMemo(() => {
    const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
    return {
      unread: open.filter((l) => l.unread > 0).length,
      escalated: open.some((l) => l.escalation),
      due: open.filter((l) => l.nextFollowUp && Date.parse(l.nextFollowUp) <= now + 864e5 && !l.optedOut).length,
    };
  }, [leads, now]);

  const groups: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: "/", label: "Overview", icon: LayoutDashboard },
        { href: "/inbox", label: "Inbox", icon: Inbox, count: counts.unread, attention: counts.escalated },
        { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
        { href: "/leads", label: "Leads", icon: Users },
        { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock, count: counts.due },
      ],
    },
    {
      label: "Manage",
      items: [
        { href: "/knowledge", label: "Knowledge base", icon: BookOpen },
        { href: "/reports", label: "Reports", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="flex h-full w-14 shrink-0 flex-col bg-sidebar text-sidebar-ink lg:w-56">
      <Link href="/" className="flex h-14 items-center gap-2.5 px-3.5 lg:px-4">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-accent font-display text-lg text-ink-inverse italic">
          n
        </span>
        <span className="hidden leading-tight lg:block">
          <span className="block text-sm font-semibold text-ink-inverse">NGH Concierge</span>
          <span className="block text-2xs text-sidebar-ink/70">Investor desk</span>
        </span>
      </Link>

      <div className="flex-1 space-y-5 overflow-y-auto px-2 py-3">
        {groups.map((g, i) => (
          <div key={i} className="space-y-0.5">
            {g.label && (
              <p className="hidden px-2 pb-1 text-2xs font-medium tracking-wide text-sidebar-ink/50 uppercase lg:block">
                {g.label}
              </p>
            )}
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "group relative flex h-8 items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors",
                    active ? "bg-sidebar-active text-ink-inverse" : "hover:bg-sidebar-hover hover:text-ink-inverse",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="hidden flex-1 lg:block">{item.label}</span>
                  {item.attention && (
                    <span className="absolute top-1.5 left-6 size-2 rounded-full bg-hot ring-2 ring-sidebar lg:static lg:ring-0" />
                  )}
                  {!!item.count && (
                    <span className="hidden lg:block">
                      <Count active={active}>{item.count}</Count>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-white/5 p-2">
        <Link
          href="/widget"
          target="_blank"
          className="flex h-8 items-center gap-2.5 rounded-sm px-2.5 text-sm hover:bg-sidebar-hover hover:text-ink-inverse"
          title="Preview concierge"
        >
          <MessageCircle className="size-4 shrink-0" />
          <span className="hidden lg:block">Preview concierge</span>
        </Link>
        <label className="relative flex h-10 items-center gap-2.5 rounded-sm px-1.5 hover:bg-sidebar-hover">
          <Avatar name={me.name} size="sm" />
          <span className="hidden min-w-0 flex-1 leading-tight lg:block">
            <span className="block truncate text-xs font-medium text-ink-inverse">{me.name}</span>
            <span className="block truncate text-2xs text-sidebar-ink/60">{me.title}</span>
          </span>
          <select
            aria-label="Switch user"
            value={meId}
            onChange={(e) => switchUser(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
