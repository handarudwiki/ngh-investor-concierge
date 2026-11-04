# BRD — NGH Investor Concierge

Oct 27, 2026 · @Diamond

## Executive summary

NGH should buy a 24/7 multilingual AI Investor Concierge that answers, qualifies and books foreign investor leads on WhatsApp and the website, then hands sales advisors a ready-to-close brief.

NGH sells high-ticket Bali property to overseas investors, in five languages (EN, ID, NL, RU, ES), through WhatsApp and Calendly. Its buyers sit in Europe and elsewhere, so many enquiries arrive while the Bali team is offline. One extra closed unit pays for the system many times over, which makes this the easiest solution for NGH to justify paying for.

The concierge does four jobs:

1. **Answer instantly** in the investor's language, using approved project, ownership and process content.
2. **Qualify** each lead on budget, timeline, ownership intent and investor type.
3. **Personalise** a short investment brief per lead (project fit, indicative scenarios, next steps).
4. **Book and hand off** a call with the right advisor, with full context logged in a CRM pipeline.

## Business context and problem

NGH loses deal momentum in the gap between an investor's first message and a qualified call with an advisor.

What NGH publicly shows ([nghpropertygroup.com](https://nghpropertygroup.com/), [About](https://nghpropertygroup.com/about)):

- Bali developer with Dutch roots, founder and CEO Mitchell Kasiman, office at Uluwatu Paradise, Ungasan.
- Flagship project Uluwatu Paradise; also design and build, listings, rentals and an investor programme.
- Site in five languages; lead entry points are WhatsApp, Calendly and email.
- Sales team of advisors and a sales partner; in-house full-stack and AI developers.
- Self-reported: 30+ projects, 40+ staff, 10+ years, 95% on-time delivery.

Problems this solves (to confirm in discovery):

| Problem | Likely impact |
| --- | --- |
| Enquiries from Europe arrive outside Bali hours | Slow first reply; investors message competing developers |
| Same questions asked repeatedly (leasehold vs freehold, PT PMA, yields, payment plan, visit) | Advisor time spent on FAQs, not closing |
| Leads arrive unqualified | Calls booked with low-intent or out-of-budget prospects |
| Lead history scattered across WhatsApp chats | No pipeline view, no follow-up discipline, no channel attribution |
| Five languages, few native speakers per language | Inconsistent answers and slower replies in NL, RU, ES |

## Objectives and success metrics

Success is measured on speed to first reply, share of qualified leads, and booked calls per month; baselines are captured in week 1 before go-live.

| Objective | KPI | Target (90 days after go-live) |
| --- | --- | --- |
| Reply to every lead fast, any hour | Median first-response time | Under 1 minute, 24/7 |
| Free advisors from repetitive questions | Conversations resolved without a human | 60% or more |
| Send advisors only serious buyers | Share of booked calls meeting qualification criteria | 70% or more |
| Grow sales meetings | Qualified calls booked per month | +30% vs baseline |
| Never let a lead go cold | Leads with a scheduled follow-up | 100% |
| Know which channel sells | Leads with source attribution | 95% or more |
| Protect the brand | Answers flagged wrong in weekly QA review | Under 2% |

Targets are proposals for NGH to adjust once baselines are known.

## Scope

Version 1 covers investor and buyer enquiries for NGH projects, starting with Uluwatu Paradise; rentals and construction clients follow later.

**In scope (v1)**

- WhatsApp Business channel and a website chat widget on nghpropertygroup.com and uluwatuparadise.com.
- Five languages: English, Bahasa Indonesia, Dutch, Russian, Spanish.
- Knowledge base built from NGH-approved content only.
- Lead qualification, scoring and routing to advisors.
- Personalised investment brief (PDF or web page) per qualified lead.
- Calendly booking and advisor handoff.
- Lightweight CRM pipeline and an advisor dashboard.
- Automated follow-up sequences on WhatsApp and email.
- Weekly performance report to management.

**Out of scope (v1)**

- Legal, tax or financial advice; the concierge refers these to NGH's advisors.
- Contract signing, payments or deposits.
- Rental guest booking and property management operations.
- Outbound cold outreach to new prospects.
- Replacing NGH's existing website or listings platform.

## Stakeholders and users

The founder buys it for revenue; sales advisors use it daily; the in-house developers own it after handover.

| Role | Who at NGH | What they need |
| --- | --- | --- |
| Sponsor and approver | Founder and CEO | More qualified meetings, brand-safe answers, weekly numbers |
| Primary users | Sales partner and sales advisors | Pre-qualified leads, full chat context, booked calls in their calendar |
| Content owner | Marketing manager | Approve knowledge base, brochures, follow-up messages |
| Compliance reviewer | Legal and corporate advisor | Approve ownership and legal wording, disclaimers |
| Finance | Financial manager | Pricing and payment-plan data kept current |
| Technical owner | In-house full-stack and AI developers | Documented system they can maintain and extend |
| End users | Prospective investors and buyers | Fast, honest answers in their language and an easy next step |

## Key user journeys

Every enquiry ends in one of three next steps, and a human can take over at any point.

&#91;embedded content: investor lead journey · 1 decision, 3 paths\]

Example: a Dutch investor messages at 22:00 Bali time, gets answers in Dutch, is scored Hot, books a call for the next morning, and the advisor opens it with the full summary already in the CRM.

## Functional requirements

Twenty requirements in six groups; the 13 marked Must define the v1 pilot.

| ID | Requirement | Priority |
| --- | --- | --- |
| **Conversation** |  |  |
| FR-01 | Reply on WhatsApp Business and website chat within 60 seconds, 24/7 | Must |
| FR-02 | Detect the lead's language and reply in EN, ID, NL, RU or ES | Must |
| FR-03 | Answer only from the approved knowledge base; say "I'll check with the team" when unsure | Must |
| FR-04 | Share approved assets on request: brochure, floor plans, photos, video, location pin | Must |
| FR-05 | Accept voice notes and reply in text | Could |
| **Qualification** |  |  |
| FR-06 | Capture name, country, contact, budget range, timeline, purpose (live, rent out, hold), ownership preference, financing | Must |
| FR-07 | Score each lead Hot, Warm or Cold using rules NGH approves | Must |
| FR-08 | Tag source (WhatsApp ad, website page, referral, social) on every lead | Should |
| **Personalisation** |  |  |
| FR-09 | Generate a 1 to 2 page investment brief per qualified lead: matching units, indicative scenarios from NGH's own assumptions, process steps | Should |
| FR-10 | Label every scenario "indicative, not a guarantee" with the assumptions shown | Must |
| **Booking and handoff** |  |  |
| FR-11 | Offer Calendly slots in the lead's time zone and confirm the booking in chat | Must |
| FR-12 | Route leads to an advisor by language, project and score | Should |
| FR-13 | Hand off to a human instantly on request, on Hot score, or on a legal or pricing negotiation question | Must |
| FR-14 | Send the advisor a summary: profile, questions asked, objections, score, brief link | Must |
| **Follow-up** |  |  |
| FR-15 | Run follow-up sequences for unbooked leads (day 1, 3, 7, 14) using approved templates | Should |
| FR-16 | Send call reminders 24 hours and 1 hour before the meeting | Must |
| FR-17 | Stop all automated messages when the lead opts out or an advisor takes over | Must |
| **Pipeline and reporting** |  |  |
| FR-18 | Keep a pipeline: New, Qualified, Call booked, Site visit, Reservation, Won, Lost | Must |
| FR-19 | Advisor dashboard: conversations, lead profiles, takeover button, notes | Should |
| FR-20 | Weekly report to management: lead volume, response time, qualified rate, calls booked, top questions, unanswered questions | Should |

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Availability | 99.5% monthly uptime; a fallback message and advisor alert if the AI service fails |
| Speed | First reply under 60 seconds; typical reply under 10 seconds |
| Accuracy | Grounded answers with no invented prices, yields or legal claims; weekly QA sample of 50 conversations |
| Brand voice | Calm, clear, premium tone matching NGH's site; reviewed by marketing before launch |
| Security | Encrypted data in transit and at rest; role-based access for advisors and admins; audit log of takeovers |
| Data residency and retention | Lead data stored in NGH-owned accounts; retention period set by NGH; deletion on request |
| Maintainability | Knowledge base editable by marketing without code; documented setup handed to NGH's developers |
| Cost control | Monthly AI and messaging cost cap with alerts at 80% |
| Scalability | Handles at least 1,000 conversations a month without redesign |

## Integrations and data

The concierge plugs into channels NGH already uses; only the CRM may be new.

| System | Purpose | Notes |
| --- | --- | --- |
| WhatsApp Business Platform (Cloud API) | Main conversation channel | Uses NGH's existing number +62 851-9052-0175 if migrated; needs Meta business verification |
| Website chat widget | Conversations from nghpropertygroup.com and uluwatuparadise.com | Shares the same agent and knowledge base |
| Calendly | Booking calls with advisors | Existing NGH account; one event type per advisor or language |
| CRM | Lead records and pipeline | Use NGH's CRM if one exists; otherwise HubSpot free tier or a simple custom pipeline |
| Email | Brief delivery and follow-ups | NGH domain sender |
| LLM provider | Language understanding and replies | Swappable; retrieval over the approved knowledge base |
| Knowledge base | Single source of truth | Project facts, unit list and prices, payment plans, ownership FAQs, process steps, brochures |

**Lead record (minimum fields):** name, country, language, phone, email, source, budget range, timeline, purpose, ownership preference, financing, score, stage, assigned advisor, consent status, conversation transcript, brief link, next follow-up date.

## Compliance and guardrails

The concierge informs and books; it never advises, promises returns or takes payment.

- **No financial or legal advice.** Ownership structures (leasehold, PT PMA, nominee risks), tax and visas get approved general explanations plus a referral to NGH's legal advisor.
- **No guaranteed returns.** Yield or ROI figures appear only from NGH's approved assumptions, always labelled indicative, with assumptions visible.
- **Indonesian data protection.** Comply with Law No. 27 of 2022 on Personal Data Protection: consent before storing details, a stated purpose, access and deletion on request.
- **EU leads.** Many buyers are Dutch or Spanish, so apply GDPR basics: lawful basis, privacy notice link, data export and erasure on request.
- **WhatsApp policy.** Follow-ups outside the 24-hour window use Meta-approved templates only, with an opt-out in every sequence.
- **AI disclosure.** The concierge introduces itself as NGH's AI assistant and offers a human at any time.
- **Escalation triggers.** Complaints, legal disputes, price negotiation and requests to speak to a person go straight to an advisor.

## Phasing and commercial model

Start with a paid 4-week pilot on one project and one channel, then expand only if the pilot hits its KPIs.

| Phase | Weeks | Deliverables | Exit gate | Proposed fee (USD) |
| --- | --- | --- | --- | --- |
| 0. Discovery | 1 | Baseline metrics, FAQ mining from past chats, qualification rules, KB content list | NGH signs off rules and content | Included in Phase 1 |
| 1. Pilot | 2 to 4 | WhatsApp concierge for Uluwatu Paradise, EN + NL, qualification, Calendly handoff, basic pipeline | First-reply under 1 min; 50+ real conversations; advisors rate handoffs useful | 2,500 to 4,000 fixed |
| 2. Expand | 5 to 8 | All five languages, website widget, investment brief, follow-up sequences, advisor dashboard, weekly report | KPI targets on track | 2,000 to 3,500 fixed |
| 3. Run and improve | Monthly | QA review, KB updates, prompt tuning, monthly report | Renew monthly | 400 to 800 per month |

Running costs (LLM, WhatsApp messages, hosting) are billed to NGH's own accounts at cost, estimated after discovery.

**Why NGH pays:** the pilot costs less than the commission on a single unit. The business case is (extra qualified calls per month) × (call-to-sale rate) × (average margin per unit), using NGH's own figures in discovery.

## Assumptions, risks and open questions

**Assumptions**

- Most investor leads arrive by WhatsApp and are handled manually today.
- NGH can supply approved content: unit list, prices, payment plans, ownership FAQs, brochures.
- Advisors will work from a shared pipeline instead of personal phones.

**Risks**

| Risk | Mitigation |
| --- | --- |
| AI gives a wrong price or legal claim | Answers grounded in the KB only; escalation on legal and pricing; weekly QA |
| In-house developers prefer to build it themselves | Position as a fixed-scope pilot with handover docs; their team owns it after |
| Advisors resist sharing their WhatsApp leads | Advisors keep ownership of their leads; dashboard saves them time |
| WhatsApp number migration disrupts current chats | Pilot on a new number or website first, migrate after |
| Low lead volume makes KPIs noisy | Measure over 4 weeks minimum; combine with ad campaigns |

**Open questions for NGH**

- [ ] How many investor enquiries arrive per month, and through which channels?
- [ ] What share arrive outside Bali business hours?
- [ ] Which CRM, if any, is in use today?
- [ ] Which languages bring the most buyers?
- [ ] What are the approved yield assumptions and disclaimers?
- [ ] Who on the sales team will own the pilot?
