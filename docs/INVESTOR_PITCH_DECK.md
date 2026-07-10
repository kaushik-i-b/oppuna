# Oppuna — Investor Pitch Deck

> **Private mental wellness support, fully offline on your phone.**

Use this document as slide copy. A browser-presentable version lives at [`docs/pitch-deck/index.html`](./pitch-deck/index.html).

---

## Slide 1 — Cover

**Oppuna**

*Peace of mind. On your terms. Offline.*

Private mental wellness companion — journal, mood tracking, breathing, and on-device AI support. No account. No cloud. No internet required.

- Version 1.0.0 · Production-ready MVP
- React Native · Expo · TypeScript
- [github.com/kaushik-i-b/oppuna](https://github.com/kaushik-i-b/oppuna)

---

## Slide 2 — The Problem

### Mental wellness apps ask for your most private thoughts — then send them to the cloud.

| Pain point | Reality today |
|---|---|
| **Privacy erosion** | Journal entries, mood logs, and AI chats stored on remote servers |
| **Connectivity dependency** | Most wellness apps fail offline or degrade without signal |
| **Trust deficit** | Breaches, subpoenas, and surveillance fears deter adoption |
| **Oversharing by design** | Accounts, analytics, and ad SDKs are baked into the business model |

> *Users want support — not surveillance.*

**67%** of people worry about how apps use their personal data (Pew Research). In mental health, that anxiety is existential: your journal is not a shopping preference.

---

## Slide 3 — Market Opportunity

### A large, growing market with a widening privacy gap

| Segment | Size & signal |
|---|---|
| **Global mental health apps** | ~$7B market (2025), projected >$10B by 2030 |
| **Digital wellness** | Post-pandemic adoption normalized self-care apps as daily tools |
| **Privacy-conscious users** | GDPR, India's DPDP Act, and HIPAA concerns push demand for local-first |
| **India opportunity** | National programs (KIRAN, Tele-MANAS) signal government investment; 1.4B population, rising smartphone penetration |
| **Underserved offline users** | Rural, travel, and low-connectivity contexts where cloud apps simply don't work |

**Our wedge:** The intersection of mental wellness + privacy-by-architecture + offline-first — a segment incumbents structurally cannot serve without rebuilding their stack.

---

## Slide 4 — The Solution

### Oppuna — a complete wellness companion that never phones home.

```
┌─────────────────────────────────────────┐
│              YOUR DEVICE                │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ Journal │  │  Mood   │  │  Chat  │  │
│  └────┬────┘  └────┬────┘  └───┬────┘  │
│       └────────────┼───────────┘       │
│              ┌─────▼─────┐             │
│              │  SQLite   │             │
│              │  (local)  │             │
│              └─────┬─────┘             │
│              ┌─────▼─────┐             │
│              │ On-device │             │
│              │ AI engine │             │
│              └───────────┘             │
│         🚫 Network guard active        │
└─────────────────────────────────────────┘
              ✕  No internet
```

- Works in **airplane mode**
- **Zero** accounts, cloud sync, analytics, or tracking
- **18 screens** of wellness features in one calm, cohesive app
- Privacy enforced by **code**, not policy

---

## Slide 5 — Product Overview

### One app. Five pillars of everyday wellness.

| Pillar | Features |
|---|---|
| **Reflect** | Journal (5 entry types), mood tracker (5 levels + intensity + 7 life-area tags), weekly insights |
| **Support** | On-device AI companion with CBT-style, mindfulness, and grounding responses |
| **Calm** | Breathing exercises (4-4-6, box, 5-min calm), 5-4-3-2-1 grounding |
| **Rest** | Sleep wind-down checklist, gentle reminders, device TTS spoken wind-down |
| **Protect** | Crisis detection → dedicated helpline screen, app lock (biometric/PIN), data export & permanent delete |

**Languages:** English · Spanish · Hindi (architecture ready for more)

**Themes:** Dark · Light · System

---

## Slide 6 — AI Companion & Safety

### Supportive AI that stays on your phone — with safety always first.

**Response pipeline (never skipped):**

1. **Safety engine** — crisis detection (suicide, self-harm, abuse, violence, medical emergency, severe panic)
2. **Local LLM** — via llama.rn when a GGUF model is present on device
3. **Rule-based engine** — intent + mood detection, CBT templates, conversation memory
4. **Safe fallback** — validated, bounded responses (max 700 chars)

**Response validator blocks:** medical diagnoses, therapy-role claims, medication advice, unsafe content, repetitive replies.

**Crisis flow:** Stops coaching immediately → shows offline helplines for 6 regions (India default: KIRAN, Tele-MANAS, AASRA, iCall, Vandrevala).

> Oppuna is **not** a medical device. It provides supportive wellness guidance only.

---

## Slide 7 — Privacy by Architecture

### We don't ask you to trust our policy. We removed the attack surface.

| Control | Implementation |
|---|---|
| **Network guard** | `fetch` and `XMLHttpRequest` wrapped; all remote hosts rejected in production |
| **Android hardening** | `INTERNET` permission blocked in manifest |
| **No telemetry** | Zero analytics SDKs, zero ad networks, zero crash reporters phoning home |
| **Local-only storage** | SQLite (`oppuna.db`) — 7 tables, versioned migrations, WAL mode |
| **User sovereignty** | Full JSON export via OS share sheet; permanent wipe of all data + voice files |
| **App Store privacy label** | **"None"** for all data collection categories |

**Positioning:** *"Private by design — not private by promise."*

---

## Slide 8 — Competitive Landscape

| Capability | **Oppuna** | Wysa / Replika | Headspace / Calm | Day One |
|---|---|---|---|---|
| Fully offline | ✅ | ❌ | ❌ | ⚠️ Partial |
| No account required | ✅ | ❌ | ❌ | ❌ |
| AI companion | ✅ On-device | ✅ Cloud | ❌ | ❌ |
| Mood tracking | ✅ | ✅ | ❌ | ❌ |
| Journal | ✅ | ⚠️ Limited | ❌ | ✅ |
| Crisis detection (local) | ✅ | ⚠️ Cloud-routed | ❌ | ❌ |
| Data never leaves device | ✅ Enforced | ❌ | ❌ | ❌ |
| Breathing / grounding | ✅ | ⚠️ | ✅ | ❌ |
| Current pricing | Free | $70+/yr | $70+/yr | Freemium |

**Our moat:** Competitors would need to abandon their cloud-centric business models to match our privacy guarantees.

---

## Slide 9 — Business Model

### Monetization aligned with privacy — not against it.

**Today:** Free, no ads, no IAP. Built to earn trust first.

**Proposed paths:**

| Model | Description | Fit |
|---|---|---|
| **Freemium** | Free rule-based companion; premium on-device LLM model pack | Natural upgrade path — LLM infra already wired |
| **One-time purchase** | $4.99–$9.99 paid app | Privacy apps succeed with upfront pricing (e.g., Day One) |
| **B2B / white-label** | Employers, schools, NGOs in privacy-sensitive sectors | No cloud = simpler procurement, no data-processing agreements |
| **Regional partnerships** | India wellness programs (Tele-MANAS ecosystem) | Offline + Hindi + bundled helplines = government-ready |
| **Tip jar / donation** | Voluntary support, no account needed | Aligns with ethos |

**Unit economics hypothesis:** Low marginal cost (no server infra) → high gross margin at scale.

---

## Slide 10 — Go-to-Market

### Launch where privacy pain is highest.

**Phase 1 — App Store launch (now)**
- Google Play production AAB ready; iOS EAS profiles configured
- ASO keywords: wellness, offline, journal, mood tracker, private, anxiety, calm
- Privacy policy live at [kaushik-i-b.github.io/oppuna](https://kaushik-i-b.github.io/oppuna/)

**Phase 2 — Community & content**
- Privacy advocates, digital rights, journalist/activist communities
- Mental health creators who emphasize self-care over clinical care
- India: Hindi content, regional wellness influencers

**Phase 3 — Partnerships**
- NGOs, employee assistance programs, university counseling centers
- Privacy-focused device makers (pre-install opportunities)

**Phase 4 — Enterprise**
- White-label for organizations that cannot use cloud wellness tools

---

## Slide 11 — Product Roadmap

| Timeline | Milestone |
|---|---|
| **Shipped (v1.0)** | 18 screens, offline AI (rule engine), crisis safety, mood/journal/breathing, app lock, export/delete, en/es/hi |
| **Q3 2026** | Bundle on-device LLM model (llama.rn integration complete); ship first GGUF model pack |
| **Q4 2026** | On-device speech-to-text for voice mode; SQLCipher encrypted storage |
| **2027** | Additional languages (Tamil, Bengali, Arabic); regional crisis resource packs |
| **2027** | B2B white-label SDK; admin-free deployment for NGOs and schools |

**Technical readiness:** LLM client, network guard, modular AI layer, and migration system are production-grade today.

---

## Slide 12 — Traction & Metrics

> *[Founder to complete — no analytics by design]*

| Metric | Current | Target (12 mo) |
|---|---|---|
| Downloads | — | — |
| DAU / MAU | — | — |
| Day-7 retention | — | — |
| App Store rating | — | — |
| Countries | Pre-launch | — |

**Product quality signals (in-repo):**
- 9 test suites, ~68 unit tests (AI engine, crisis detection, database)
- TypeScript strict mode, ESLint, versioned DB migrations
- Production Android build pipeline documented

---

## Slide 13 — Team

> *[Founder to complete]*

**[Founder Name]**
- Role / background
- Why this problem
- Relevant experience (mobile, mental health, privacy, India market)

**Advisors** *(optional)*
- Clinical / wellness advisor
- Privacy / security advisor
- Go-to-market advisor

**GitHub:** [kaushik-i-b](https://github.com/kaushik-i-b) · **Repo:** [oppuna](https://github.com/kaushik-i-b/oppuna)

---

## Slide 14 — The Ask

> *[Founder to complete]*

**Raising:** $[X] [Pre-seed / Seed]

**Use of funds:**

| Allocation | % | Purpose |
|---|---|---|
| Product & engineering | 50% | On-device LLM shipping, STT, encryption, iOS launch |
| Go-to-market | 25% | ASO, community, India launch, partnerships |
| Clinical & safety review | 15% | Crisis flow audits, wellness content, compliance |
| Operations | 10% | Legal, app store, infrastructure |

**18-month milestones:**
1. 100K+ downloads across Android + iOS
2. Shipped on-device LLM with measurable engagement lift
3. 2+ B2B/NGO pilot partnerships
4. 4.5+ App Store rating with published retention data

---

## Slide 15 — Why Now

1. **Cloud AI backlash** — Users increasingly wary of sending intimate thoughts to remote LLMs
2. **On-device AI inflection** — llama.cpp / mobile NPUs make local LLMs viable on mid-range phones
3. **Regulatory pressure** — DPDP (India), GDPR, state privacy laws favor local-first architectures
4. **India mental health moment** — Government helplines and Tele-MANAS create ecosystem tailwinds
5. **Product is built** — Not a slide-deck startup; v1.0 is production-ready today

---

## Slide 16 — Closing

### Oppuna

**Peace of mind. On your terms. Offline.**

A private, offline journal, mood, and reflection companion.

- 🌿 No account · No cloud · No tracking
- 🔒 Privacy by architecture
- 🫶 Gentle, everyday support

**Contact:** [Founder email]
**Demo:** `docs/pitch-deck/index.html` or install from Google Play *(when live)*
**Privacy:** [kaushik-i-b.github.io/oppuna](https://kaushik-i-b.github.io/oppuna/)

---

*Oppuna is not a doctor, therapist, crisis service, or medical device. It provides supportive wellness guidance only.*
