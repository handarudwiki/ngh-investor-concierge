// Minimal chart primitives on the design tokens. Magnitude uses one hue (the
// accent); labels and values stay in ink tokens; every mark has a hover
// tooltip. Single-series charts need no legend — the card title names them.

import { cn } from "@/lib/cn";

export interface Datum {
  label: string;
  value: number;
  /** Optional detail line for the tooltip. */
  detail?: string;
}

/** Ranked horizontal bars with direct value labels. */
export function HBars({ data, format = String, empty = "No data" }: { data: Datum[]; format?: (n: number) => string; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="py-6 text-center text-xs text-ink-subtle">{empty}</p>;
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.label} className="group relative grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm">
          <span className="truncate text-ink-muted" title={d.label}>
            {d.label}
          </span>
          <span className="h-2.5 rounded-xs bg-subtle">
            <span
              className="block h-full rounded-r-xs bg-accent transition-opacity group-hover:opacity-80"
              style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value ? 4 : 0 }}
            />
          </span>
          <span className="text-right font-medium text-ink tabular-nums">{format(d.value)}</span>
          {d.detail && (
            <span className="pointer-events-none absolute -top-8 left-32 z-10 hidden rounded-sm bg-ink px-2 py-1 text-2xs whitespace-nowrap text-ink-inverse shadow-md group-hover:block">
              {d.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Vertical bars over time, baseline-anchored, with a hover tooltip per bar. */
export function Columns({ data, height = 160 }: { data: Datum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pb-5 text-right text-2xs text-ink-subtle tabular-nums" style={{ height }}>
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="relative flex-1">
        {/* recessive grid */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 20 }}>
          {ticks.map((t) => (
            <span key={t} className="border-t border-dashed border-line" />
          ))}
        </div>
        <div className="relative flex items-end gap-0.5" style={{ height: height - 20 }}>
          {data.map((d) => (
            <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
              <span
                className={cn("w-full max-w-7 rounded-t-xs bg-accent transition-opacity group-hover:opacity-80", !d.value && "bg-transparent")}
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 0 }}
              />
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-sm bg-ink px-2 py-1 text-2xs whitespace-nowrap text-ink-inverse shadow-md group-hover:block">
                <b className="font-semibold">{d.label}</b> · {d.value} lead{d.value === 1 ? "" : "s"}
                {d.detail && <> · {d.detail}</>}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-0.5">
          {data.map((d, i) => (
            <span key={d.label} className="flex-1 truncate text-center text-[10px] text-ink-subtle">
              {data.length <= 14 || i % Math.ceil(data.length / 10) === 0 ? d.label.split(" ")[0] : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
