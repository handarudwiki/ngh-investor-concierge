"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/** Underlined tabs that sit at the bottom edge of a PageHeader or pane header. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("-mb-px flex gap-4", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-medium transition-colors",
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-2xs tabular-nums",
                  active ? "bg-accent-soft text-accent-ink" : "bg-subtle text-ink-subtle",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pill switcher for filters and view toggles. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("inline-flex rounded-sm border border-line bg-subtle p-0.5", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex h-6 items-center gap-1 rounded-xs px-2 text-xs font-medium transition-colors",
              active ? "bg-surface text-ink shadow-xs" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="text-ink-subtle tabular-nums">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
