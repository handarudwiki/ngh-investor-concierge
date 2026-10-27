import { cn } from "@/lib/cn";

const palette = [
  "bg-[#e3f1ef] text-[#0a4f4d]",
  "bg-[#e6edfa] text-[#2f5bb7]",
  "bg-[#fdf1dc] text-[#8a5608]",
  "bg-[#fde8e3] text-[#a3341f]",
  "bg-[#ece6f7] text-[#5b3f99]",
  "bg-[#e4f3ea] text-[#1f7a4d]",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter((p) => /^\p{L}/u.test(p));
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const sizes = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-2xs",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-lg",
};

export function Avatar({
  name,
  size = "md",
  className,
  ring,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        palette[hash(name) % palette.length],
        sizes[size],
        ring && "ring-2 ring-surface",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** The concierge's own avatar — always the accent mark, never initials. */
export function BotAvatar({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-display text-ink-inverse italic",
        sizes[size],
        className,
      )}
    >
      n
    </span>
  );
}
