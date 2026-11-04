"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, FileText, Image as ImageIcon, MapPin, Mic, Send, ShieldCheck, Square, UserRound, Video, X } from "lucide-react";
import { BotAvatar, Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { bookCall, createLead, editLead, newMessage, uid } from "@/lib/actions";
import { advisorLoad } from "@/lib/rules";
import { clock, day } from "@/lib/format";
import { getState, useStore } from "@/lib/store";
import { t } from "@/lib/concierge/i18n";
import type { TurnResult } from "@/lib/concierge/types";
import type { AssetRef, Channel, Language, Lead } from "@/lib/types";
import { formatDuration, useVoiceNote } from "./use-voice-note";

export interface Visitor {
  country: string;
  timezone: string;
  language: Language;
  page: string;
}

const assetIcon: Record<AssetRef["kind"], typeof FileText> = {
  brochure: FileText,
  floor_plan: FileText,
  photos: ImageIcon,
  video: Video,
  location: MapPin,
};

const PERSON: Record<Language, string> = {
  en: "I'd like to talk to a person, please.",
  nl: "Ik wil graag met een medewerker praten.",
  id: "Saya ingin bicara dengan staf.",
  ru: "Я хочу поговорить с человеком.",
  es: "Quisiera hablar con una persona, por favor.",
};

/**
 * The investor-facing concierge chat (FR-01). The same component renders the
 * website widget and a WhatsApp-style preview; both feed the advisor inbox.
 */
export function ChatWidget({
  channel,
  visitor,
  leadId,
  onLead,
}: {
  channel: Channel;
  visitor: Visitor;
  leadId?: string;
  onLead: (id: string) => void;
}) {
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const advisors = useStore((s) => s.advisors);
  const privacyUrl = useStore((s) => s.settings.privacyUrl);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [consented, setConsented] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const lang = lead?.language ?? visitor.language;
  const visible = useMemo(() => (lead?.messages ?? []).filter((m) => !m.internal && m.author !== "system"), [lead]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [visible.length, typing, slots.length]);

  const ensureLead = (): Lead => {
    const existing = leadId ? getState().leads.find((l) => l.id === leadId) : undefined;
    if (existing) return existing;
    const now = new Date().toISOString();
    const id = uid("w");
    const created: Lead = {
      id,
      name: channel === "web" ? `Website visitor #${Math.floor(1000 + Math.random() * 9000)}` : "WhatsApp contact",
      country: visitor.country,
      language: visitor.language,
      timezone: visitor.timezone,
      channel,
      source: channel === "web" ? "website" : "whatsapp_ad",
      sourceDetail: channel === "web" ? visitor.page : "Meta ad · click-to-WhatsApp",
      project: "Uluwatu Paradise",
      score: "cold",
      stage: "new",
      consent: "granted",
      optedOut: false,
      mode: "bot",
      createdAt: now,
      lastMessageAt: now,
      unread: 0,
      messages: [
        newMessage(
          "system",
          channel === "web"
            ? `Website chat started on ${visitor.page} · consent to store details given`
            : "New WhatsApp conversation · source: Meta ad · consent to store details given",
        ),
      ],
      topics: [],
      objections: [],
      unitIds: [],
      followUpStep: 0,
    };
    createLead(created);
    onLead(id);
    return created;
  };

  const send = async (raw: string, voice?: { durationSec: number }) => {
    const body = raw.trim();
    if (!body || typing) return;
    setText("");
    setSlots([]);
    const current = ensureLead();
    editLead(current.id, (l) => ({
      ...l,
      unread: l.unread + 1,
      lastMessageAt: new Date().toISOString(),
      messages: [
        ...l.messages,
        newMessage("lead", body, voice && { voice }),
        // FR-05: the concierge works from the transcript and replies in text.
        ...(voice ? [newMessage("system", `Voice note (${formatDuration(voice.durationSec)}) transcribed · concierge replies in text`)] : []),
      ],
    }));

    // FR-17: once a human has taken over, the concierge stays silent.
    const fresh = getState().leads.find((l) => l.id === current.id)!;
    if (fresh.mode === "human") return;

    setTyping(true);
    try {
      const s = getState();
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: { ...fresh, messages: fresh.messages.slice(0, -1) },
          text: body,
          context: {
            kb: s.kb,
            units: s.units,
            advisors: s.advisors,
            load: advisorLoad(s.leads),
            settings: s.settings,
            assumptions: s.assumptions,
          },
        }),
      });
      if (!res.ok) throw new Error(`Concierge returned ${res.status}`);
      const turn = (await res.json()) as TurnResult;
      editLead(current.id, (l) => ({
        ...l,
        ...turn.patch,
        lastMessageAt: new Date().toISOString(),
        messages: [
          ...l.messages,
          newMessage("bot", turn.reply, { sources: turn.sources, assets: turn.assets }),
          ...turn.events.map((e) => newMessage("system", e)),
        ],
      }));
      setSlots(turn.slots);
    } catch {
      // NFR availability: fallback message and advisor alert.
      editLead(current.id, (l) => ({
        ...l,
        escalation: "Concierge unavailable",
        messages: [
          ...l.messages,
          newMessage("bot", t(lang, "service_down")),
          newMessage("system", "Concierge request failed · fallback message sent · advisor alerted"),
        ],
      }));
    } finally {
      setTyping(false);
    }
  };

  const pickSlot = (slot: string) => {
    if (!lead) return;
    setSlots([]);
    const label = `${day(slot, lead.timezone)}, ${clock(slot, lead.timezone)}`;
    editLead(lead.id, (l) => ({ ...l, messages: [...l.messages, newMessage("lead", label)] }));
    bookCall(lead.id, slot);
    const booked = getState().leads.find((l) => l.id === lead.id)!;
    const advisor = advisors.find((a) => a.id === booked.booking?.advisorId);
    editLead(lead.id, (l) => ({
      ...l,
      escalation: l.escalation === "Hot score — instant handoff" ? undefined : l.escalation,
      messages: [
        ...l.messages,
        newMessage("bot", t(l.language, "booked", { advisor: advisor?.name ?? "our advisor", when: label, tz: l.timezone })),
      ],
    }));
  };

  const voice = useVoiceNote((transcript, durationSec) => send(transcript, { durationSec }));

  const isWa = channel === "whatsapp";
  const started = Boolean(lead) || consented;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-4 py-3 text-ink-inverse", isWa ? "bg-whatsapp" : "bg-accent")}>
        <BotAvatar size="md" className="bg-ink-inverse/15" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">NGH Investor Concierge</p>
          <p className="text-2xs opacity-80">
            {lead?.mode === "human" ? "An advisor is chatting with you" : "AI assistant · replies instantly, 24/7"}
          </p>
        </div>
        {started && lead?.mode !== "human" && (
          <button
            onClick={() => send(PERSON[lang])}
            className="inline-flex items-center gap-1 rounded-full bg-ink-inverse/15 px-2.5 py-1 text-2xs font-medium hover:bg-ink-inverse/25"
          >
            <UserRound className="size-3" /> Talk to a person
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={cn("flex-1 space-y-3 overflow-y-auto px-4 py-4", isWa ? "bg-[#efeae2]" : "bg-canvas")}>
        <div className="flex gap-2">
          <BotAvatar size="sm" />
          <div className="max-w-[85%] rounded-lg rounded-tl-xs bg-surface px-3 py-2 text-sm shadow-xs">
            {t(visitor.language, "greeting")}
          </div>
        </div>

        {!started && (
          <div className="ml-8 rounded-lg border border-line bg-surface p-3 text-xs text-ink-muted shadow-xs">
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-accent" />
              <span>
                {t(visitor.language, "consent")}{" "}
                <a href={privacyUrl} target="_blank" rel="noreferrer" className="font-medium text-accent underline">
                  Privacy notice
                </a>
              </span>
            </p>
            <button
              onClick={() => setConsented(true)}
              className="mt-2.5 w-full rounded-sm bg-accent py-1.5 text-xs font-semibold text-ink-inverse hover:bg-accent-hover"
            >
              Agree & start chatting
            </button>
          </div>
        )}

        {visible.map((m) => {
          const mine = m.author === "lead";
          const advisor = advisors.find((a) => a.id === m.advisorId);
          return (
            <div key={m.id} className={cn("flex gap-2 animate-pop-in", mine && "flex-row-reverse")}>
              {!mine && (m.author === "bot" ? <BotAvatar size="sm" /> : <Avatar name={advisor?.name ?? "NGH"} size="sm" />)}
              <div className={cn("flex max-w-[85%] flex-col", mine && "items-end")}>
                {m.author === "advisor" && <span className="mb-0.5 text-2xs text-ink-subtle">{advisor?.name} · NGH</span>}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-xs",
                    mine
                      ? cn("rounded-tr-xs", isWa ? "bg-[#d9fdd3] text-ink" : "bg-accent text-ink-inverse")
                      : "rounded-tl-xs bg-surface text-ink",
                  )}
                >
                  {m.voice && (
                    <span className="mb-1 flex items-center gap-1 text-2xs font-medium opacity-80">
                      <Mic className="size-3" /> Voice note · {formatDuration(m.voice.durationSec)}
                    </span>
                  )}
                  {m.text}
                  {m.assets?.map((a) => {
                    const Icon = assetIcon[a.kind];
                    const href = a.id === "brief" ? `/brief/${lead!.id}` : undefined;
                    return (
                      <a
                        key={a.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 rounded-sm border border-line bg-subtle p-1.5 pr-3 text-xs font-medium text-ink hover:border-line-strong"
                      >
                        <span className="inline-flex size-7 items-center justify-center rounded-xs bg-accent-soft text-accent">
                          <Icon className="size-3.5" />
                        </span>
                        {a.label}
                      </a>
                    );
                  })}
                </div>
                <span className="mt-0.5 text-[10px] text-ink-subtle">{clock(m.at, visitor.timezone)}</span>
              </div>
            </div>
          );
        })}

        {slots.length > 0 && lead && (
          <div className="ml-8 grid grid-cols-2 gap-1.5">
            {slots.map((s) => (
              <button
                key={s}
                onClick={() => pickSlot(s)}
                className="flex items-center gap-1.5 rounded-sm border border-accent/30 bg-surface px-2.5 py-2 text-left text-xs hover:bg-accent-soft"
              >
                <CalendarCheck className="size-3.5 shrink-0 text-accent" />
                <span>
                  <span className="block font-semibold text-ink">{clock(s, lead.timezone)}</span>
                  <span className="block text-2xs text-ink-subtle">{day(s, lead.timezone)}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {typing && (
          <div className="flex gap-2">
            <BotAvatar size="sm" />
            <div className="flex gap-1 rounded-lg rounded-tl-xs bg-surface px-3 py-3 shadow-xs">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 rounded-full bg-ink-subtle animate-typing" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {/* Composer */}
      {voice.error && <p className="border-t border-line bg-surface px-4 pt-2 text-2xs text-danger">{voice.error}</p>}
      {voice.recording ? (
        <div className="flex items-center gap-2 border-t border-line bg-surface p-3">
          <button
            onClick={voice.cancel}
            aria-label="Discard voice note"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-subtle hover:bg-subtle"
          >
            <X className="size-4" />
          </button>
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-danger/30 bg-danger-soft px-4 text-sm">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-danger" />
            <span className="truncate text-ink-muted">{voice.recording.interim || "Listening…"}</span>
          </div>
          <button
            onClick={voice.stop}
            aria-label="Send voice note"
            className={cn("inline-flex size-9 items-center justify-center rounded-full text-ink-inverse", isWa ? "bg-whatsapp" : "bg-accent")}
          >
            <Square className="size-3.5 fill-current" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex items-center gap-2 border-t border-line bg-surface p-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!started}
            placeholder={started ? "Type your message…" : "Agree to start chatting"}
            className="h-9 flex-1 rounded-full border border-line bg-subtle px-4 text-sm outline-none focus:border-accent focus:bg-surface disabled:opacity-60"
          />
          {text.trim() ? (
            <button
              type="submit"
              disabled={!started || typing}
              aria-label="Send"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-ink-inverse disabled:opacity-40",
                isWa ? "bg-whatsapp" : "bg-accent",
              )}
            >
              <Send className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => voice.start(lang)}
              disabled={!started || typing || !voice.supported}
              aria-label="Record a voice note"
              title={voice.supported ? "Record a voice note" : "Voice notes need a browser with speech recognition (Chrome, Edge or Safari)"}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-ink-inverse disabled:opacity-40",
                isWa ? "bg-whatsapp" : "bg-accent",
              )}
            >
              <Mic className="size-4" />
            </button>
          )}
        </form>
      )}
      <p className="bg-surface pb-2 text-center text-[10px] text-ink-subtle">
        AI assistant · answers from NGH-approved information · not financial or legal advice
      </p>
    </div>
  );
}
