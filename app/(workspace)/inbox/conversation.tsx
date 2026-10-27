"use client";

import { useState } from "react";
import { Bot, Hand, Lock, Send, Star } from "lucide-react";
import { Badge, Button, Dialog, Segmented, Textarea } from "@/components/ui";
import { StageBadge } from "@/components/domain";
import { cn } from "@/lib/cn";
import { handBack, sendAdvisorMessage, takeOver, toggleStar } from "@/lib/actions";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";

export function ThreadHeader({ lead }: { lead: Lead }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-base font-semibold">{lead.name}</h2>
          <StageBadge stage={lead.stage} />
        </div>
        <p className="flex items-center gap-1 text-2xs text-ink-subtle">
          {lead.mode === "bot" ? (
            <>
              <Bot className="size-3" /> Concierge is replying automatically
            </>
          ) : (
            <>
              <Hand className="size-3" /> Advisor is handling · automations paused
            </>
          )}
        </p>
      </div>
      <Button icon variant="ghost" size="sm" aria-label="Star" onClick={() => toggleStar(lead.id)}>
        <Star className={cn(lead.starred && "fill-warning text-warning")} />
      </Button>
      {lead.mode === "bot" ? (
        <Button variant="primary" size="sm" onClick={() => setConfirm(true)}>
          <Hand /> Take over
        </Button>
      ) : (
        <Button size="sm" onClick={() => handBack(lead.id)}>
          <Bot /> Hand back
        </Button>
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Take over this conversation?"
        description="The concierge stops replying and every automated follow-up pauses until you hand it back."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                takeOver(lead.id);
                setConfirm(false);
              }}
            >
              Take over
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">The takeover is recorded in the audit log with your name and time.</p>
      </Dialog>
    </div>
  );
}

export function Composer({ lead }: { lead: Lead }) {
  const kb = useStore((s) => s.kb);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState("");
  const blocked = mode === "reply" && lead.mode === "bot";

  const send = () => {
    const t = text.trim();
    if (!t || blocked) return;
    sendAdvisorMessage(lead.id, t, mode === "note");
    setText("");
  };

  const snippets = kb.filter((k) => k.approved && (k.body[lead.language] || k.body.en));

  return (
    <div className="shrink-0 border-t border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <Segmented
          value={mode}
          onChange={setMode}
          items={[
            { value: "reply", label: "Reply" },
            { value: "note", label: <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Internal note</span> },
          ]}
        />
        {mode === "reply" && !blocked && (
          <select
            aria-label="Insert approved answer"
            value=""
            onChange={(e) => {
              const k = kb.find((x) => x.id === e.target.value);
              if (k) setText((t) => (t ? t + "\n\n" : "") + (k.body[lead.language] ?? k.body.en));
            }}
            className="h-6 max-w-48 rounded-xs border border-line bg-surface px-1.5 text-xs text-ink-muted"
          >
            <option value="">Insert approved answer…</option>
            {snippets.map((k) => (
              <option key={k.id} value={k.id}>
                {k.title}
                {!k.body[lead.language] ? " (EN)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      {blocked ? (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-line-strong bg-subtle px-3 py-3">
          <p className="text-xs text-ink-muted">
            The concierge is handling this conversation. Take over to reply yourself, or leave an internal note.
          </p>
          <Button size="sm" variant="primary" onClick={() => takeOver(lead.id)}>
            <Hand /> Take over
          </Button>
        </div>
      ) : (
        <div className={cn("rounded-sm border", mode === "note" ? "border-warning/40 bg-warning-soft/40" : "border-line")}>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            placeholder={
              mode === "note"
                ? "Only advisors see this…"
                : `Reply to ${lead.name.split(" ")[0]} on ${lead.channel === "whatsapp" ? "WhatsApp" : "website chat"}…`
            }
            className="min-h-16 resize-none border-0 bg-transparent shadow-none focus:ring-0"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-2xs text-ink-subtle">
              {lead.optedOut ? <Badge tone="danger">Opted out of automated messages</Badge> : "⌘ + Enter to send"}
            </span>
            <Button size="sm" variant={mode === "note" ? "secondary" : "primary"} onClick={send} disabled={!text.trim()}>
              {mode === "note" ? <Lock /> : <Send />} {mode === "note" ? "Add note" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
