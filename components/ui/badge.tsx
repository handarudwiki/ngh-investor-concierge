import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "hot"
  | "warm"
  | "cold";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-muted border-line",
  accent: "bg-accent-soft text-accent-ink border-accent/15",
  success: "bg-success-soft text-success border-success/15",
  warning: "bg-warning-soft text-warning border-warning/15",
  danger: "bg-danger-soft text-danger border-danger/15",
  info: "bg-info-soft text-info border-info/15",
  hot: "bg-hot-soft text-hot border-hot/15",
  warm: "bg-warm-soft text-warm border-warm/15",
  cold: "bg-cold-soft text-cold border-cold/15",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-subtle",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  hot: "bg-hot",
  warm: "bg-warm",
  cold: "bg-cold",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-xs border px-1.5 text-2xs font-medium whitespace-nowrap [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}

/** Small round counter, used in nav items and tabs. */
export function Count({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-2xs font-semibold tabular-nums",
        active ? "bg-accent text-ink-inverse" : "bg-muted text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}
