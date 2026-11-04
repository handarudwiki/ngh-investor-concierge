# NGH Investor Concierge

A 24/7 multilingual AI concierge that answers, qualifies and books foreign investor leads for NGH Property Group, plus the advisor workspace that receives them. Built from the BRD in `BRD — NGH Investor Concierge.md`.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY to use Claude
npm run dev
```

Open the workspace at `/` and sign in with a demo account (password `ngh-demo`; Dewi Lestari is the admin). The investor-facing chat is at `/widget`. Chat as an investor in one tab and watch the lead, score and escalations appear in the inbox in another — the tabs stay in sync.

## What's in it

| Area | Route | BRD |
| --- | --- | --- |
| Design system (tokens + components) | `/design-system` | Brand voice NFR |
| Sign-in, advisor and admin roles | `/login` | Security NFR |
| Overview: KPIs vs targets, attention list, upcoming calls, costs | `/` | Objectives |
| Inbox: views, thread, takeover, notes, handoff summary | `/inbox` | FR-13, 14, 17, 19 |
| Concierge engine + website/WhatsApp widget, voice notes | `/widget`, `POST /api/concierge` | FR-01–08, 10, 11, 13 |
| Pipeline board (New → Won/Lost) | `/pipeline` | FR-18 |
| Leads table, profile, export/delete on request | `/leads`, `/leads/[id]` | FR-19, PDP Law, GDPR |
| Investment brief (printable, in the lead's language) | `/brief/[id]` | FR-09, 10 |
| Follow-up sequences, call reminders, templates | `/follow-ups` | FR-15, 16, 17 |
| Knowledge base, units, scenario assumptions, gaps | `/knowledge` | FR-03, maintainability |
| Weekly management report | `/reports` | FR-20 |
| Weekly QA review of concierge answers | `/qa` | Accuracy NFR |
| Scoring rules, routing, cost cap, compliance, audit log | `/settings` | FR-07, 12, NFRs |

See [`docs/`](docs/README.md) for the BRD coverage matrix and a user guide with screenshots.

## How the concierge works

Each inbound message goes through two layers (`lib/concierge/`):

1. **Understanding**: Claude (`claude.ts`, structured JSON output grounded in the approved KB) when an Anthropic credential is set, otherwise a deterministic rules engine (`understand.ts`) for language detection, field extraction in EN/ID/NL/RU/ES, intents and KB retrieval. If Claude fails, the rules engine answers and an advisor is alerted.
2. **Policy** (`policy.ts`): NGH's approved rules make every decision, whichever engine understood the message: opt-out, scoring, routing, escalation (on request, Hot score, legal, pricing negotiation, complaint), brief generation, booking slots and follow-up scheduling. The LLM never decides these.

Approved concierge copy for all five languages lives in `i18n.ts`.

## Prototype boundaries

- **Data** lives in the browser (`lib/store.ts`, localStorage). In production this is the CRM (NGH's own, HubSpot, or a custom pipeline). Settings → Data & compliance resets the demo data.
- **Sign-in** checks the team list with a shared demo password, and roles are enforced in the browser (`lib/permissions.ts`). Production needs NGH's identity provider and server-side checks.
- **Voice notes** are transcribed in the browser with the Web Speech API. WhatsApp audio will need a speech-to-text service.
- **Channels**: the widget simulates WhatsApp and website chat. The WhatsApp Cloud API, Calendly and email sending aren't connected yet. Booking uses Calendly-style slots in the advisors' Bali hours that also fall in the lead's waking hours.
- **Content**: advisors and leads are fictional. Units, prices, yield assumptions and KB copy are placeholders until NGH approves real content in Phase 0.
- The scheduler for follow-ups and reminders runs on demand from the Follow-ups page; in production it's a cron job.

## Code map

```
app/(workspace)/   advisor workspace pages (shared sidebar layout)
app/login/         sign-in
app/widget/        investor chat preview
app/brief/[id]/    printable investment brief
app/api/concierge/ concierge turn endpoint
components/ui/     design-system primitives
components/        domain pieces, lead panels, widget, charts
lib/               types, rules (scoring/routing/scenarios), store, actions, metrics, seed
lib/concierge/     engine: understanding, policy, Claude, i18n
```
