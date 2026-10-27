import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "xs" | "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink-inverse hover:bg-accent-hover shadow-xs border border-transparent",
  secondary:
    "bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong shadow-xs",
  ghost: "text-ink-muted hover:bg-subtle hover:text-ink border border-transparent",
  subtle: "bg-subtle text-ink hover:bg-muted border border-transparent",
  danger:
    "bg-surface text-danger border border-line hover:bg-danger-soft hover:border-danger/30 shadow-xs",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-xs gap-1 rounded-xs",
  sm: "h-7 px-2.5 text-sm gap-1.5 rounded-sm",
  md: "h-8 px-3 text-sm gap-2 rounded-sm",
};

const iconSizes: Record<Size, string> = {
  xs: "h-6 w-6 rounded-xs",
  sm: "h-7 w-7 rounded-sm",
  md: "h-8 w-8 rounded-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Square button that holds only an icon. Pass an aria-label. */
  icon?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        icon ? iconSizes[size] : sizes[size],
        className,
      )}
      {...props}
    />
  );
});
