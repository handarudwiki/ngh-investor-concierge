import type { Advisor, Assumptions, AssetRef, KbArticle, Language, Lead, Settings, Unit } from "../types";

export type Intent = "question" | "human" | "negotiation" | "complaint" | "booking" | "stop";

export type ExtractedFields = Partial<
  Pick<Lead, "name" | "email" | "phone" | "country" | "budget" | "timeline" | "purpose" | "ownership" | "financing">
>;

/** What one inbound message means — produced by Claude or by the rules fallback. */
export interface Understanding {
  language: Language;
  fields: ExtractedFields;
  intents: Intent[];
  assets: AssetRef["kind"][];
  kbIds: string[];
  /** Answer text already written in the lead's language (Claude only). */
  answer?: string;
  /** The question, if the KB couldn't answer it (FR-03). */
  unanswered?: string;
  topics: string[];
  objection?: string;
}

export interface ConciergeContext {
  kb: KbArticle[];
  units: Unit[];
  advisors: Advisor[];
  /** Open leads per advisor id, for routing (FR-12). */
  load: Record<string, number>;
  settings: Settings;
  assumptions: Assumptions;
}

export interface TurnRequest {
  lead: Lead;
  text: string;
  context: ConciergeContext;
}

export interface TurnResult {
  engine: "claude" | "rules";
  language: Language;
  reply: string;
  sources: string[];
  assets: AssetRef[];
  /** Calendly slots to offer as quick replies (FR-11). */
  slots: string[];
  patch: Partial<Lead>;
  /** System lines for the advisor's thread (scoring, routing, escalation). */
  events: string[];
}
