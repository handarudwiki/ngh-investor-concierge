"use client";

import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Avatar, Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { bookCall } from "@/lib/actions";
import { routeLead } from "@/lib/rules";
import { useNow, useStore } from "@/lib/store";
import { clock, day } from "@/lib/format";
import type { Lead } from "@/lib/types";

/** Next N weekday slots in the advisor's Bali hours, shown in the lead's time zone (FR-11). */
export function nextSlots(now: number, count = 6) {
  const out: string[] = [];
  // Advisor availability: 09:00–17:00 WITA (UTC+8) → 01:00–09:00 UTC.
  const hoursUtc = [1, 3, 6, 8];
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < 14 * 24 && out.length < count; i++) {
    d.setUTCHours(d.getUTCHours() + 1);
    const wita = new Date(d.getTime() + 8 * 3600e3);
    const weekday = wita.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (!hoursUtc.includes(d.getUTCHours())) continue;
    if (d.getTime() - now < 2 * 3600e3) continue;
    out.push(d.toISOString());
  }
  return out;
}

export function BookCallDialog({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const now = useNow();
  const advisors = useStore((s) => s.advisors);
  const leads = useStore((s) => s.leads);
  const slots = useMemo(() => nextSlots(now), [now]);
  const [picked, setPicked] = useState<string>();
  const advisor =
    advisors.find((a) => a.id === lead.advisorId) ?? routeLead(lead, advisors, leads);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setPicked(undefined);
        onClose();
      }}
      title="Book a call"
      description={`Times shown in ${lead.name.split(" ")[0]}'s time zone · ${lead.timezone}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!picked}
            onClick={() => {
              bookCall(lead.id, picked!);
              setPicked(undefined);
              onClose();
            }}
          >
            <CalendarCheck /> Confirm booking
          </Button>
        </>
      }
    >
      {advisor && (
        <div className="mb-4 flex items-center gap-2.5 rounded-sm bg-subtle px-3 py-2">
          <Avatar name={advisor.name} size="sm" />
          <div className="text-xs">
            <p className="font-medium text-ink">{advisor.name}</p>
            <p className="text-ink-subtle">{advisor.calendlyUrl.replace("https://", "")}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => setPicked(s)}
            className={cn(
              "rounded-sm border px-3 py-2 text-left transition-colors",
              picked === s ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong hover:bg-subtle",
            )}
          >
            <p className="text-sm font-medium">{clock(s, lead.timezone)}</p>
            <p className="text-2xs text-ink-subtle">{day(s, lead.timezone)}</p>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
