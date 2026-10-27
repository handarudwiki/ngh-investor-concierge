// Small domain-specific building blocks reused across workspace screens.

import { Globe, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { LANGUAGES, SCORES, stageLabel, stageTone } from "@/lib/labels";
import type { Channel, Language, Score, Stage } from "@/lib/types";

export function ScoreBadge({ score }: { score: Score }) {
  return (
    <Badge tone={SCORES[score].tone} dot>
      {SCORES[score].label}
    </Badge>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge tone={stageTone(stage)}>{stageLabel(stage)}</Badge>;
}

export function LangTag({ lang }: { lang: Language }) {
  return (
    <span
      title={LANGUAGES[lang].label}
      className="inline-flex h-4 items-center rounded-xs border border-line px-1 font-mono text-[10px] font-medium text-ink-muted"
    >
      {LANGUAGES[lang].flag}
    </span>
  );
}

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const Icon = channel === "whatsapp" ? MessageCircle : Globe;
  return (
    <Icon
      aria-label={channel === "whatsapp" ? "WhatsApp" : "Website chat"}
      className={cn("size-3.5", channel === "whatsapp" ? "text-whatsapp" : "text-web", className)}
    />
  );
}

/** Key/value row for profile panels. */
export function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-2 py-1 text-sm">
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-ink">{children ?? <span className="text-ink-subtle">—</span>}</dd>
    </div>
  );
}
