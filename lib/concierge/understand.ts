// Deterministic understanding of an inbound message. Used when no LLM is
// configured and as the fallback when the AI service fails (NFR availability).

import type { AssetRef, Budget, KbArticle, Language, Lead, Timeline } from "../types";
import type { ExtractedFields, Intent, Understanding } from "./types";

const STOPWORDS: Record<Exclude<Language, "ru">, string[]> = {
  en: ["the", "is", "are", "what", "how", "hi", "hello", "i", "you", "do", "can", "my", "price", "want", "villa", "buy"],
  nl: ["de", "het", "een", "ik", "jullie", "wat", "hoe", "hallo", "goedemiddag", "goedenavond", "graag", "kunnen", "zijn", "voor", "niet", "wil", "kopen"],
  es: ["hola", "el", "la", "los", "que", "qué", "cómo", "cuánto", "quiero", "una", "para", "es", "por", "me", "gracias", "comprar"],
  id: ["halo", "saya", "apa", "apakah", "berapa", "yang", "ada", "untuk", "dengan", "ini", "itu", "bisa", "mau", "terima", "kasih", "selamat"],
};

export function detectLanguage(text: string, fallback: Language): Language {
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  let best: Language = fallback;
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS) as [Language, string[]][]) {
    const score = words.filter((w) => list.includes(w)).length + (/[¿¡ñ]/.test(text) && lang === "es" ? 2 : 0);
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  // Short messages ("ok", "10:30") keep the conversation's language.
  return bestScore >= 1 ? best : fallback;
}

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

function budgetFrom(text: string): Budget | undefined {
  const t = text.toLowerCase().replace(/(\d)[ .,](?=\d{3}\b)/g, "$1");
  const amounts: number[] = [];
  // The unit must end at a word boundary so "3 months" isn't read as "3M".
  const re = /(\d+(?:[.,]\d+)?)\s*(k|m|mil|miljoen|million|millones|millón|млн|миллион\p{L}*|тыс\p{L}*|ribu|rb|juta)?(?!\p{L})/gu;
  for (const m of t.matchAll(re)) {
    const n = parseFloat(m[1].replace(",", "."));
    const unit = m[2] ?? "";
    let v = n;
    if (/^(k|mil|тыс|ribu|rb)/.test(unit) && !/^(miljoen|million|millón|millones)$/.test(unit)) v = n * 1e3; // Spanish "300 mil" = 300,000
    else if (unit === "juta") v = (n * 1e6) / 16_000; // IDR millions → USD
    else if (unit) v = n * 1e6;
    if (v >= 50_000 && v <= 50_000_000) amounts.push(v);
  }
  if (/миллион|million|miljoen|millón/u.test(t) && !amounts.length) amounts.push(1e6);
  if (!amounts.length) return undefined;
  let v = Math.max(...amounts);
  if (/(more than|over|above|больше|более|más de|meer dan|lebih dari)/.test(t)) v *= 1.2;
  if (v < 250_000) return "<250k";
  if (v <= 500_000) return "250-500k";
  if (v <= 1_000_000) return "500k-1m";
  return "1m+";
}

function timelineFrom(t: string): Timeline | undefined {
  const months = t.match(/(\d+)\s*(?:-|to|a|tot|до)?\s*(\d+)?\s*(months?|maanden?|месяц\w*|meses|bulan)/);
  if (months) {
    const n = parseInt(months[2] ?? months[1], 10);
    return n <= 3 ? "0-3m" : n <= 6 ? "3-6m" : n <= 12 ? "6-12m" : "12m+";
  }
  if (has(t, ["asap", "right away", "quickly", "this month", "zo snel", "direct", "срочно", "сразу", "cuanto antes", "secepatnya", "segera", "move quickly"])) return "0-3m";
  if (has(t, ["half a year", "half year", "halfjaar", "half jaar", "полгода", "полугод", "medio año", "seis meses", "enam bulan"])) return "3-6m";
  if (has(t, ["2 years", "two years", "couple of years", "not in a hurry", "no rush", "geen haast", "не спешу", "sin prisa", "tidak buru", "year or two"])) return "12m+";
  if (has(t, ["next year", "this year", "volgend jaar", "в следующем году", "в этом году", "el próximo año", "el año que viene", "tahun depan", "within a year", "binnen een jaar"])) return "6-12m";
  return undefined;
}

function purposeFrom(t: string): Lead["purpose"] {
  // A question about rentals ("what are the rental yields?") isn't a stated purpose.
  if (t.includes("?")) return undefined;
  if (has(t, ["rent", "verhu", "сдава", "аренд", "alquil", "disewa", "sewakan", "airbnb"])) return "rent_out";
  if (/\blive\b/.test(t) || has(t, ["relocat", "move to bali", "wonen", "verhuizen", "жить", "переезд", "vivir", "mudar", "tinggal", "menetap"])) return "live";
  if (/\bhold\b/.test(t) || has(t, ["invest", "capital growth", "belegging", "инвест", "inversión", "investasi"])) return "hold";
  return undefined;
}

function financingFrom(t: string): Lead["financing"] {
  if (has(t, ["cash", "contant", "наличн", "contado", "efectivo", "tunai", "cash buyer"])) return "cash";
  if (has(t, ["mortgage", "loan", "financing", "finance", "hypotheek", "financiering", "ипотек", "кредит", "hipoteca", "financiación", "kpr", "pinjaman"])) return "mortgage";
  return undefined;
}

function ownershipFrom(t: string): Lead["ownership"] {
  if (has(t, ["pt pma", "freehold", "hak milik", "фрихолд", "eigendom"])) return "freehold_pt_pma";
  if (/\bleasehold\b|лизхолд|erfpacht/.test(t) && has(t, ["prefer", "fine", "ok", "want", "voorkeur", "goed", "подходит", "prefiero", "mau"])) return "leasehold";
  return undefined;
}

function nameFrom(text: string): string | undefined {
  const m = text.match(
    /(?:my name is|i am|i'm|this is|ik ben|mijn naam is|me llamo|soy|меня зовут|я\s|nama saya|saya)\s+([A-ZÀ-ÖØ-ÞА-Я][\p{L}'-]+(?:\s+[A-ZÀ-ÖØ-ÞА-Я][\p{L}'-]+)?)/u,
  );
  return m?.[1];
}

export function extractFields(text: string): ExtractedFields {
  const t = text.toLowerCase();
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = text.match(/\+\d[\d\s-]{7,}\d/)?.[0];
  const out: ExtractedFields = {
    email,
    phone,
    budget: budgetFrom(text),
    timeline: timelineFrom(t),
    purpose: purposeFrom(t),
    financing: financingFrom(t),
    ownership: ownershipFrom(t),
    name: nameFrom(text),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as ExtractedFields;
}

const INTENT_WORDS: Record<Exclude<Intent, "question">, string[]> = {
  stop: [],
  human: ["human", "real person", "a person", "speak to someone", "talk to someone", "agent", "advisor", "adviseur", "medewerker", "een mens", "человек", "менеджер", "оператор", "консультант", "persona", "humano", "asesor", "staf", "orang", "manusia", "cs"],
  negotiation: ["discount", "best price", "lower price", "negotia", "deal on", "korting", "onderhandel", "скидк", "торг", "descuento", "rebaja", "negociar", "diskon", "nego", "potongan"],
  complaint: ["complain", "complaint", "unacceptable", "terrible service", "scam", "klacht", "жалоб", "обман", "queja", "reclamación", "estafa", "komplain", "kecewa", "penipuan"],
  booking: ["call", "meeting", "book", "appointment", "schedule", "zoom", "afspraak", "gesprek", "bellen", "звон", "встреч", "созвон", "llamada", "reunión", "cita", "telepon", "jadwal", "janji", "visit", "bezoek", "visita", "kunjungan"],
};

const ASSET_WORDS: Record<AssetRef["kind"], string[]> = {
  brochure: ["brochure", "brosur", "брошюр", "folleto", "pdf", "price list", "prijslijst"],
  floor_plan: ["floor plan", "floorplan", "plattegrond", "layout", "планировк", "plano", "denah"],
  photos: ["photo", "picture", "foto", "фото", "imagen", "gambar"],
  video: ["video", "видео", "walkthrough", "tour video"],
  location: ["location", "where is", "map", "pin", "locatie", "waar ligt", "где находится", "локац", "ubicación", "dónde", "lokasi", "dimana", "di mana"],
};

export function detectIntents(text: string): Intent[] {
  const t = text.toLowerCase().trim();
  const intents: Intent[] = [];
  if (/^(stop|unsubscribe|berhenti|стоп|baja|afmelden|stopp)\.?$/i.test(t)) return ["stop"];
  for (const [intent, words] of Object.entries(INTENT_WORDS) as [Intent, string[]][]) {
    if (words.some((w) => (w.length <= 3 ? new RegExp(`\\b${w}\\b`).test(t) : t.includes(w)))) intents.push(intent);
  }
  if (/\?|^(what|how|when|where|why|which|can|do|is|are|wat|hoe|wanneer|waar|kan|qué|cómo|cuándo|dónde|cuánto|apa|bagaimana|kapan|berapa|как|что|когда|где|сколько|какая|какой)\b/i.test(t)) {
    intents.push("question");
  }
  return intents;
}

export function detectAssets(text: string): AssetRef["kind"][] {
  const t = text.toLowerCase();
  return (Object.entries(ASSET_WORDS) as [AssetRef["kind"], string[]][])
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([k]) => k);
}

/** Keyword retrieval over approved articles only (FR-03). */
export function searchKb(text: string, kb: KbArticle[], limit = 2) {
  const t = text.toLowerCase();
  return kb
    .filter((k) => k.approved)
    .map((k) => ({ k, score: k.keywords.filter((w) => t.includes(w.toLowerCase())).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.k);
}

export const topicOf = (k: KbArticle) => k.title.split(/ — | \(| vs /)[0];

export function understandWithRules(text: string, lead: Lead, kb: KbArticle[]): Understanding {
  const language = detectLanguage(text, lead.messages.some((m) => m.author === "lead") ? lead.language : "en");
  const intents = detectIntents(text);
  const assets = detectAssets(text);
  const fields = extractFields(text);
  const isQuestion = intents.includes("question");
  // Statements that only share details ("budget 300k, to rent out") get no KB answer.
  const statement = !isQuestion && Object.keys(fields).length > 0;
  const hits = intents.includes("stop") || statement ? [] : searchKb(text, kb);
  return {
    language,
    fields,
    intents,
    assets,
    kbIds: hits.map((k) => k.id),
    unanswered: isQuestion && hits.length === 0 && assets.length === 0 && !intents.some((i) => i !== "question") ? text : undefined,
    topics: hits.map(topicOf),
    objection: intents.includes("negotiation") ? "Asked about price / discount" : undefined,
  };
}
