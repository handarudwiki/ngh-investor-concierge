"use client";

import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Avatar, Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { bookCall } from "@/lib/actions";
import { advisorLoad, nextSlots, routeLead } from "@/lib/rules";
import { useNow, useStore } from "@/lib/store";
import { clock, day } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function BookCallDialog({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const now = useNow();
  const advisors = useStore((s) => s.advisors);
  const leads = useStore((s) => s.leads);
  const hours = useStore((s) => s.settings.businessHours);
  const slots = useMemo(() => nextSlots(now, 6, lead.timezone, hours), [now, lead.timezone, hours]);
  const [picked, setPicked] = useState<string>();
  const advisor =
    advisors.find((a) => a.id === lead.advisorId) ?? routeLead(lead, advisors, advisorLoad(leads));

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
