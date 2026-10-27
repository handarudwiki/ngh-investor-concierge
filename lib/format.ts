export function relTime(iso: string, now: number) {
  const diff = now - Date.parse(iso);
  const future = diff < 0;
  const m = Math.round(Math.abs(diff) / 60_000);
  let out: string;
  if (m < 1) out = "now";
  else if (m < 60) out = `${m}m`;
  else if (m < 60 * 24) out = `${Math.round(m / 60)}h`;
  else if (m < 60 * 24 * 7) out = `${Math.round(m / 1440)}d`;
  else out = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (out === "now") return out;
  return future ? `in ${out}` : out;
}

export function dateTime(iso: string, timeZone?: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function clock(iso: string, timeZone?: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
}

export function day(iso: string, timeZone?: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone });
}

export function duration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Bali (WITA, UTC+8) business hours check, used for after-hours stats. */
export function isAfterHours(iso: string, start = 9, end = 18) {
  const h = (new Date(iso).getUTCHours() + 8) % 24;
  return h < start || h >= end;
}
