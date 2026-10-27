import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-xs border border-line bg-surface px-1 font-sans text-2xs text-ink-subtle shadow-xs">
      {children}
    </kbd>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-subtle text-ink-subtle">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-xs text-ink-subtle">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** KPI tile used on the overview and the weekly report. */
export function Stat({
  label,
  value,
  target,
  delta,
  good,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  target?: string;
  delta?: string;
  /** Whether the current value meets target — colours the delta. */
  good?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        {Icon && <Icon className="size-3.5 text-ink-subtle" />}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="flex items-center gap-2 text-2xs">
        {delta && (
          <span
            className={cn(
              "font-medium",
              good === undefined ? "text-ink-muted" : good ? "text-success" : "text-danger",
            )}
          >
            {delta}
          </span>
        )}
        {target && <span className="text-ink-subtle">Target {target}</span>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface px-6 pt-4">
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Thin horizontal progress meter, e.g. KPI vs target or cost cap. */
export function Meter({
  value,
  max = 100,
  tone = "accent",
  className,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "warning" | "danger" | "success";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = {
    accent: "bg-accent",
    warning: "bg-warning",
    danger: "bg-danger",
    success: "bg-success",
  }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
