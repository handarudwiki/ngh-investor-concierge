# BRD coverage

How the prototype maps to `BRD — NGH Investor Concierge.md`. Status as of 28 Oct 2026.

**Legend:** ✅ done in the prototype · 🟡 done, but simulated or partial until production integrations exist · ❌ not built

## Summary

- **All 20 functional requirements are built**: 13 Must, 6 Should and the Could (FR-05, voice notes).
- **NFRs and guardrails** are covered in the prototype, including the weekly QA review and role-based sign-in.
- **What remains for production** is connecting the real services: WhatsApp Cloud API, Calendly, email sending, a CRM or database in place of browser storage, an identity provider for sign-in, and a cron job for follow-ups. See [Not yet connected](#not-yet-connected).

## Functional requirements

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| **Conversation** | | | | |
| FR-01 | Reply on WhatsApp and website chat within 60 s, 24/7 | Must | 🟡 | `POST /api/concierge`, `/widget`. Replies are instant; both channels are simulated in the widget. Median first reply is tracked on the Overview and Reports pages. |
| FR-02 | Detect language, reply in EN/ID/NL/RU/ES | Must | ✅ | `lib/concierge/understand.ts` (`detectLanguage`), copy in `lib/concierge/i18n.ts` |
| FR-03 | Answer only from the approved KB; "I'll check with the team" when unsure | Must | ✅ | `policy.ts` answers from KB articles (or Claude grounded on them); only approved articles are used; unknowns are logged as unanswered questions |
| FR-04 | Share approved assets: brochure, floor plans, photos, video, location | Must | 🟡 | `policy.ts` attaches asset cards; files are placeholders until NGH supplies content |
| FR-05 | Accept voice notes, reply in text | Could | 🟡 | Mic button in the widget records and transcribes in the browser (Web Speech API, in the lead's language); the concierge answers the transcript in text and advisors see a "Voice note · transcript" bubble. WhatsApp audio needs a server-side speech-to-text service once the Cloud API is connected. `components/widget/use-voice-note.ts` |
| **Qualification** | | | | |
| FR-06 | Capture name, country, contact, budget, timeline, purpose, ownership, financing | Must | ✅ | Field extraction in `understand.ts` / `claude.ts`; lead record in `lib/types.ts` |
| FR-07 | Score Hot/Warm/Cold with NGH-approved rules | Must | ✅ | `lib/rules.ts` (`scoreLead`), editable in Settings → Qualification with impact preview |
| FR-08 | Tag source on every lead | Should | ✅ | `Lead.source` + `sourceDetail`; attribution KPI on Overview and Reports |
| **Personalisation** | | | | |
| FR-09 | 1–2 page brief: matching units, indicative scenarios, process steps | Should | ✅ | `/brief/[id]`, printable to PDF, in the lead's language |
| FR-10 | Label scenarios "indicative, not a guarantee" with assumptions shown | Must | ✅ | Brief scenario table + disclaimer; assumptions editable in Knowledge base |
| **Booking and handoff** | | | | |
| FR-11 | Offer Calendly slots in the lead's time zone, confirm in chat | Must | 🟡 | `nextSlots` in `lib/rules.ts` offers advisor slots inside Bali business hours that also fall between 08:00 and 21:00 for the lead, shown and confirmed in the lead's time zone. Calendly is simulated. |
| FR-12 | Route by language, project and score | Should | ✅ | `routeLead` in `lib/rules.ts`: language → project → senior advisor for Hot → lowest load |
| FR-13 | Instant handoff on request, Hot score, legal or pricing negotiation | Must | ✅ | Escalation triggers in `policy.ts`; also complaints |
| FR-14 | Advisor summary: profile, questions, objections, score, brief link | Must | ✅ | `components/lead/summary.tsx`, shown in Inbox and lead profile |
| **Follow-up** | | | | |
| FR-15 | Day 1/3/7/14 sequences with approved templates | Should | 🟡 | `/follow-ups`; WhatsApp sends only Meta-approved templates. Sending is simulated; scheduler runs on demand. |
| FR-16 | Call reminders 24 h and 1 h before | Must | 🟡 | `/follow-ups` → Call reminders; sending is simulated |
| FR-17 | Stop automation on opt-out or advisor takeover | Must | ✅ | Opt-out in `policy.ts`; `lib/actions.ts` skips opted-out, taken-over, withdrawn-consent and closed leads |
| **Pipeline and reporting** | | | | |
| FR-18 | Pipeline: New → Qualified → Call booked → Site visit → Reservation → Won/Lost | Must | ✅ | `/pipeline` drag-and-drop board |
| FR-19 | Advisor dashboard: conversations, profiles, takeover, notes | Should | ✅ | `/inbox`, `/leads`, `/leads/[id]` |
| FR-20 | Weekly management report | Should | ✅ | `/reports` (7/14/30 days, print to PDF) |

## Non-functional requirements

| Area | Status | Notes |
| --- | --- | --- |
| Availability (fallback + advisor alert) | ✅ | If Claude fails, the rules engine answers and the lead is escalated with "AI service unavailable" (`app/api/concierge/route.ts`). Uptime SLA is a hosting concern. |
| Speed | ✅ | Rules engine replies instantly; Claude replies in seconds |
| Accuracy (grounded, weekly QA of 50 conversations) | ✅ | Answers are grounded and the LLM never decides prices, scores or escalations. `/qa` samples up to 50 conversations a week; an admin marks each concierge answer correct or wrong (with the issue and a note). The "answers flagged wrong < 2%" KPI shows on the Overview, the weekly report and the QA page. `lib/qa.ts` |
| Brand voice | ✅ | Approved copy in `i18n.ts`; design system at `/design-system` |
| Security (encryption, role-based access, takeover audit log) | 🟡 | Sign-in at `/login`; the workspace redirects signed-out visitors. Advisors work leads; admins also get Settings, Quality review, knowledge base and template editing, and lead deletion (`lib/permissions.ts`). Sign-ins, takeovers and settings changes go to the audit log. In the prototype the checks run in the browser with a shared demo password; production needs an identity provider and server-side enforcement. Encryption depends on production hosting. |
| Data residency and retention | 🟡 | Retention period, export and delete-on-request are built. Data lives in browser localStorage in the prototype. |
| Maintainability | ✅ | KB, units, assumptions and templates editable without code; this documentation |
| Cost control (cap, alert at 80%) | ✅ | Settings → Cost control and Overview meter; the alert is shown in-app, not sent |
| Scalability | — | Not testable in the prototype; depends on the production CRM and hosting |

## Compliance and guardrails

| Guardrail | Status | Where |
| --- | --- | --- |
| No financial or legal advice | ✅ | Legal/tax KB articles marked `escalate` hand off to an advisor |
| No guaranteed returns | ✅ | Scenarios only from approved assumptions, always labelled indicative |
| Indonesian PDP Law (consent, purpose, access, deletion) | ✅ | Consent gate in the widget; export and delete on lead profile |
| GDPR basics (privacy notice, export, erasure) | ✅ | Privacy notice link in Settings → Data & compliance |
| WhatsApp policy (approved templates, opt-out) | ✅ | Non-approved templates are skipped on WhatsApp; every sequence includes STOP |
| AI disclosure, human at any time | ✅ | Greeting in every language; "speak to a person" escalates |
| Escalation triggers | ✅ | Complaint, legal, negotiation, human request, Hot score |

## Not yet connected

These are expected for a prototype and are listed in the README under *Prototype boundaries*:

- WhatsApp Business Cloud API (needs Meta business verification)
- Calendly booking
- Email sending from the NGH domain
- A real CRM or database in place of localStorage
- A cron job for the follow-up scheduler
- An identity provider (e.g. Google Workspace SSO) with server-side sessions in place of the demo password
- Speech-to-text for WhatsApp voice notes

## Fixed since the first review

- **Booking slots at night for overseas leads.** Slots were generated from advisors' Bali hours only, so a Dutch lead was offered 02:00 Amsterdam. `nextSlots` now keeps only slots inside the lead's 08:00–21:00. If none overlap within two weeks, it falls back to all advisor slots.
- **Seeded chats disagreed with bookings.** The demo conversations now quote the same times as the booking records.
- **Slots vanished on a new conversation's first turn.** The widget preview remounted the chat when the first message created the lead, discarding the slot buttons. It now remounts only on "New conversation" or a channel/visitor change.
