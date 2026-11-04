"use client";

import { useEffect, useRef } from "react";
import { BookOpen, FileText, Image as ImageIcon, Lock, MapPin, Mic, Video } from "lucide-react";
import { Avatar, BotAvatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clock, day } from "@/lib/format";
import { useStore } from "@/lib/store";
import { formatDuration } from "@/components/widget/use-voice-note";
import type { AssetRef, Lead, Message } from "@/lib/types";

const assetIcon: Record<AssetRef["kind"], typeof FileText> = {
  brochure: FileText,
  floor_plan: FileText,
  photos: ImageIcon,
  video: Video,
  location: MapPin,
};

function Asset({ a, leadId }: { a: AssetRef; leadId: string }) {
  const Icon = assetIcon[a.kind];
  const href = a.id === "brief" ? `/brief/${leadId}` : undefined;
  const body = (
    <>
      <span className="inline-flex size-7 items-center justify-center rounded-xs bg-accent-soft text-accent">
        <Icon className="size-3.5" />
      </span>
      <span className="truncate text-xs font-medium">{a.label}</span>
    </>
  );
  return href ? (
    <a href={href} target="_blank" className="mt-2 flex items-center gap-2 rounded-sm border border-line bg-surface p-1.5 pr-3 hover:border-line-strong">
      {body}
    </a>
  ) : (
    <div className="mt-2 flex items-center gap-2 rounded-sm border border-line bg-surface p-1.5 pr-3">{body}</div>
  );
}

function Bubble({ m, lead }: { m: Message; lead: Lead }) {
  const advisors = useStore((s) => s.advisors);
  const kb = useStore((s) => s.kb);
  const templates = useStore((s) => s.templates);

  if (m.author === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="max-w-[80%] rounded-full bg-subtle px-3 py-1 text-center text-2xs text-ink-subtle">
          {m.text} · {clock(m.at)}
        </span>
      </div>
    );
  }

  const isLead = m.author === "lead";
  const advisor = advisors.find((a) => a.id === m.advisorId);
  const sourceLabels = (m.sources ?? [])
    .map((id) => kb.find((k) => k.id === id)?.title ?? templates.find((t) => t.id === id)?.name)
    .filter(Boolean);

  return (
    <div className={cn("flex gap-2.5", !isLead && "flex-row-reverse")}>
      <div className="pt-5">
        {isLead ? (
          <Avatar name={lead.name} size="sm" />
        ) : m.author === "bot" ? (
          <BotAvatar size="sm" />
        ) : (
          <Avatar name={advisor?.name ?? "Advisor"} size="sm" />
        )}
      </div>
      <div className={cn("flex max-w-[72%] flex-col", !isLead && "items-end")}>
        <div className="mb-1 flex items-center gap-1.5 text-2xs text-ink-subtle">
          <span className="font-medium text-ink-muted">
            {isLead ? lead.name : m.author === "bot" ? "Concierge" : advisor?.name}
          </span>
          {m.author === "bot" && (
            <span className="rounded-xs bg-accent-soft px-1 text-[10px] font-semibold text-accent-ink">AI</span>
          )}
          {m.internal && (
            <span className="inline-flex items-center gap-0.5 text-warning">
              <Lock className="size-2.5" /> Internal note
            </span>
          )}
          <span>{clock(m.at)}</span>
        </div>
        <div
          className={cn(
            "rounded-lg px-3.5 py-2.5 text-base whitespace-pre-wrap",
            isLead && "rounded-tl-xs border border-line bg-surface",
            m.author === "bot" && "rounded-tr-xs bg-accent-soft text-ink",
            m.author === "advisor" && !m.internal && "rounded-tr-xs bg-ink text-ink-inverse",
            m.internal && "rounded-tr-xs border border-dashed border-warning/40 bg-warning-soft text-ink",
          )}
        >
          {m.voice && (
            <span className="mb-1 flex items-center gap-1 text-2xs font-medium text-ink-subtle">
              <Mic className="size-3" /> Voice note · {formatDuration(m.voice.durationSec)} · transcript
            </span>
          )}
          {m.text}
          {m.assets?.map((a) => <Asset key={a.id} a={a} leadId={lead.id} />)}
        </div>
        {sourceLabels.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-end gap-1">
            {sourceLabels.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-[10px] text-ink-subtle">
                <BookOpen className="size-2.5" /> {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Thread({ lead }: { lead: Lead }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [lead.id, lead.messages.length]);

  return (
    <div className="space-y-4 px-6 py-5">
      {lead.messages.map((m, i) => {
        const d = day(m.at);
        const showDay = i === 0 || d !== day(lead.messages[i - 1].at);
        return (
          <div key={m.id}>
            {showDay && (
              <div className="my-3 flex items-center gap-3 text-2xs font-medium text-ink-subtle">
                <span className="h-px flex-1 bg-line" /> {d} <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <Bubble m={m} lead={lead} />
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
