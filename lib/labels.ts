import type { Tone } from "@/components/ui";
import type {
  Budget,
  Channel,
  Financing,
  Language,
  Ownership,
  Purpose,
  Score,
  Source,
  Stage,
  Timeline,
} from "./types";

export const LANGUAGES: Record<Language, { label: string; native: string; flag: string }> = {
  en: { label: "English", native: "English", flag: "EN" },
  id: { label: "Indonesian", native: "Bahasa Indonesia", flag: "ID" },
  nl: { label: "Dutch", native: "Nederlands", flag: "NL" },
  ru: { label: "Russian", native: "Русский", flag: "RU" },
  es: { label: "Spanish", native: "Español", flag: "ES" },
};

export const STAGES: { value: Stage; label: string; tone: Tone }[] = [
  { value: "new", label: "New", tone: "neutral" },
  { value: "qualified", label: "Qualified", tone: "accent" },
  { value: "call_booked", label: "Call booked", tone: "info" },
  { value: "site_visit", label: "Site visit", tone: "info" },
  { value: "reservation", label: "Reservation", tone: "warning" },
  { value: "won", label: "Won", tone: "success" },
  { value: "lost", label: "Lost", tone: "danger" },
];
export const stageLabel = (s: Stage) => STAGES.find((x) => x.value === s)!.label;
export const stageTone = (s: Stage) => STAGES.find((x) => x.value === s)!.tone;

export const SCORES: Record<Score, { label: string; tone: Tone }> = {
  hot: { label: "Hot", tone: "hot" },
  warm: { label: "Warm", tone: "warm" },
  cold: { label: "Cold", tone: "cold" },
};

export const SOURCES: Record<Source, string> = {
  whatsapp_ad: "WhatsApp ad",
  website: "Website",
  referral: "Referral",
  social: "Social",
  direct: "Direct",
};

export const CHANNELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  web: "Website chat",
};

export const BUDGETS: Record<Budget, string> = {
  "<250k": "Under $250k",
  "250-500k": "$250k – $500k",
  "500k-1m": "$500k – $1M",
  "1m+": "$1M+",
};

export const TIMELINES: Record<Timeline, string> = {
  "0-3m": "Within 3 months",
  "3-6m": "3 – 6 months",
  "6-12m": "6 – 12 months",
  "12m+": "12 months +",
};

export const PURPOSES: Record<Purpose, string> = {
  live: "Live in",
  rent_out: "Rent out",
  hold: "Hold / capital growth",
};

export const OWNERSHIP: Record<Ownership, string> = {
  leasehold: "Leasehold",
  freehold_pt_pma: "Freehold via PT PMA",
  undecided: "Undecided",
};

export const FINANCING: Record<Financing, string> = {
  cash: "Cash",
  mortgage: "Mortgage / financing",
  undecided: "Undecided",
};

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
