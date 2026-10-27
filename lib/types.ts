// Domain model for the NGH Investor Concierge. Field names follow the BRD's
// "Lead record (minimum fields)" list.

export type Language = "en" | "id" | "nl" | "ru" | "es";
export type Channel = "whatsapp" | "web";
export type Source = "whatsapp_ad" | "website" | "referral" | "social" | "direct";
export type Score = "hot" | "warm" | "cold";
export type Stage =
  | "new"
  | "qualified"
  | "call_booked"
  | "site_visit"
  | "reservation"
  | "won"
  | "lost";
export type Purpose = "live" | "rent_out" | "hold";
export type Ownership = "leasehold" | "freehold_pt_pma" | "undecided";
export type Financing = "cash" | "mortgage" | "undecided";
export type Budget = "<250k" | "250-500k" | "500k-1m" | "1m+";
export type Timeline = "0-3m" | "3-6m" | "6-12m" | "12m+";
export type Consent = "granted" | "pending" | "withdrawn";

export interface Advisor {
  id: string;
  name: string;
  title: string;
  languages: Language[];
  projects: string[];
  /** Sales partner gets Hot leads first. */
  senior: boolean;
  calendlyUrl: string;
  email: string;
  role: "advisor" | "admin";
}

export interface AssetRef {
  id: string;
  kind: "brochure" | "floor_plan" | "photos" | "video" | "location";
  label: string;
}

export interface Message {
  id: string;
  author: "lead" | "bot" | "advisor" | "system";
  advisorId?: string;
  text: string;
  at: string;
  /** Internal advisor note — never sent to the lead. */
  internal?: boolean;
  assets?: AssetRef[];
  /** KB article ids the bot grounded its answer in (FR-03). */
  sources?: string[];
}

export interface Booking {
  at: string;
  advisorId: string;
  timezone: string;
  remindersSent: ("24h" | "1h")[];
}

export interface Lead {
  id: string;
  name: string;
  country: string;
  language: Language;
  timezone: string;
  phone?: string;
  email?: string;
  channel: Channel;
  source: Source;
  sourceDetail?: string;
  project: string;
  budget?: Budget;
  timeline?: Timeline;
  purpose?: Purpose;
  ownership?: Ownership;
  financing?: Financing;
  score: Score;
  stage: Stage;
  advisorId?: string;
  consent: Consent;
  optedOut: boolean;
  /** "human" after takeover — the concierge stays silent (FR-17). */
  mode: "bot" | "human";
  /** Why the concierge escalated, if it did (FR-13). */
  escalation?: string;
  createdAt: string;
  lastMessageAt: string;
  unread: number;
  messages: Message[];
  /** Topics the lead asked about, for the advisor summary (FR-14). */
  topics: string[];
  objections: string[];
  briefGeneratedAt?: string;
  unitIds: string[];
  booking?: Booking;
  /** Follow-up sequence position (FR-15). 0 = not started. */
  followUpStep: number;
  nextFollowUp?: string;
  lostReason?: string;
  starred?: boolean;
}

export interface KbArticle {
  id: string;
  category: "project" | "ownership" | "process" | "pricing" | "investment" | "visit" | "company";
  title: string;
  keywords: string[];
  body: Partial<Record<Language, string>>;
  /** Compliance reviewer sign-off for ownership/legal wording. */
  approved: boolean;
  /** Questions in this area hand off to a human (FR-13). */
  escalate?: boolean;
  owner: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  project: string;
  name: string;
  type: "Apartment" | "Villa";
  bedrooms: number;
  sizeSqm: number;
  priceUsd: number;
  leaseYears: number;
  status: "available" | "reserved" | "sold";
  handover: string;
  /** Indicative average daily rate used in scenarios. */
  adrUsd: number;
}

export interface Assumptions {
  occupancy: { conservative: number; base: number; optimistic: number };
  managementFeePct: number;
  operatingCostPct: number;
  disclaimer: string;
  approvedBy: string;
  updatedAt: string;
}

export type TemplateKind = "day1" | "day3" | "day7" | "day14" | "reminder24" | "reminder1";

export interface Template {
  id: string;
  kind: TemplateKind;
  name: string;
  channel: "whatsapp" | "email";
  body: Partial<Record<Language, string>>;
  /** WhatsApp templates outside the 24h window need Meta approval. */
  metaApproved: boolean;
  active: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  leadId?: string;
}

export interface ScoringRules {
  budget: Record<Budget, number>;
  timeline: Record<Timeline, number>;
  cashBuyer: number;
  contactShared: number;
  purposeKnown: number;
  hotAt: number;
  warmAt: number;
}

export interface Settings {
  costCapUsd: number;
  costSpentUsd: number;
  alertAtPct: number;
  businessHours: { start: number; end: number; timezone: string };
  scoring: ScoringRules;
  autoHandoffOnHot: boolean;
  followUpsEnabled: boolean;
  retentionMonths: number;
  privacyUrl: string;
}

export interface State {
  version: number;
  me: string;
  advisors: Advisor[];
  leads: Lead[];
  kb: KbArticle[];
  units: Unit[];
  assumptions: Assumptions;
  templates: Template[];
  audit: AuditEntry[];
  settings: Settings;
}
