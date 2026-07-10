# Oppuna — Investor Pitch Deck

**Private mental wellness support, fully offline on your phone.**

Version 1.0 · July 2026 · Confidential

> **How to use this deck:** Each `---` block is one slide. Import into Google Slides, Pitch, or Keynote, or open `docs/pitch-deck/index.html` for the web presentation.

---

## Slide 1 — Title

# Oppuna 🌿

**The privacy-first mental wellness companion that never phones home.**

*Private mental wellness support, fully offline on your phone.*

**v1.0.0 · Production-ready on Android**

[Contact] · [Website] · [Demo APK]

---

## Slide 2 — One-liner

> **Oppuna is a fully offline, on-device mental wellness app — chat, journal, mood tracking, breathing, and crisis safety — with zero accounts, zero cloud, and zero data collection.**

Built for people who want support without surrendering their most private thoughts to a server.

---

## Slide 3 — The Problem

### Mental health demand is exploding. Trust in digital wellness is collapsing.

| Pain point | Reality |
|---|---|
| **Access gap** | ~1B people globally affected by mental health conditions; therapy waitlists and costs remain barriers |
| **Privacy crisis** | Mozilla's 2024 audit: **37% of iOS mental health apps** sent identifiers to Facebook |
| **Regulatory risk** | HIPAA-grade infrastructure adds **~$300K/year** overhead; GDPR fines reach millions |
| **Cloud dependency** | Most AI wellness apps require always-on internet — unusable offline, in rural areas, or during travel |
| **Stigma & surveillance fear** | Users avoid journaling and chat apps because they don't trust where their data goes |

**People need support. They don't trust the apps offering it.**

Sources: Mordor Intelligence, Mozilla *Privacy Not Included* 2024, Fortune Business Insights

---

## Slide 4 — The Solution

# Oppuna: Wellness that lives entirely on your device

- **100% offline** — works in airplane mode, forever
- **Zero data collection** — no accounts, no analytics, no telemetry
- **On-device AI companion** — rule-based engine + optional local LLM (llama.rn)
- **Crisis safety built in** — detects distress and routes to dedicated support resources
- **Full wellness toolkit** — mood, journal, breathing, grounding, sleep, voice notes, insights

**Privacy by architecture, not by policy.**

---

## Slide 5 — Product Overview

### One app. Complete private wellness stack.

```
┌─────────────────────────────────────────────────────────┐
│  Chat (on-device AI)  │  Mood tracker  │  Journal      │
├─────────────────────────────────────────────────────────┤
│  Breathing & grounding │  Sleep support │  Voice notes │
├─────────────────────────────────────────────────────────┤
│  Self-care plan │  Insights dashboard │  Crisis safety │
├─────────────────────────────────────────────────────────┤
│  Biometric app lock │  Export / delete │  EN · ES · HI  │
└─────────────────────────────────────────────────────────┘
         ▲ All data in local SQLite · Never leaves device
```

**18 screens · Production Android build · App Store listing ready**

---

## Slide 6 — How It Works (AI Pipeline)

### Safe, layered on-device intelligence

```
User message
    ↓
① Safety engine (crisis detection — always first, never skipped)
    ↓
② Local LLM (llama.rn) — if model available, with streaming
    ↓ (validated or discarded)
③ Rule-based fallback — CBT, mindfulness, grounding + conversation memory
    ↓
④ Safe fallback text (last resort)
```

- **Response validator** rejects harmful or repetitive replies
- **Conversation memory** prevents robotic repetition
- **Network guard** blocks every outbound request in production

*No API keys. No server bills. No data pipeline.*

---

## Slide 7 — Privacy Moat

### We didn't write a privacy policy. We removed the attack surface.

| Competitor pattern | Oppuna |
|---|---|
| Account + cloud sync | No account |
| Analytics SDKs | None |
| Remote AI API calls | Blocked at code level |
| Android INTERNET permission | **Explicitly blocked** |
| Crisis data on servers | Metadata only, local SQLite |

**Technical guarantees investors can diligence:**
- `networkGuard.ts` wraps `fetch` and `XMLHttpRequest`
- Production builds have no code path to the internet
- User can export JSON or permanently delete all data

**This is a structural advantage — not a marketing claim.**

---

## Slide 8 — Crisis Safety

### Responsible AI for mental wellness

Oppuna detects signs of:
- Suicide & self-harm
- Abuse & violence
- Medical emergencies
- Severe panic

**When crisis is detected:**
1. Normal coaching stops immediately
2. Dedicated crisis support screen appears
3. Only category + timestamp stored locally — **never the message text**

Positioned as **wellness support, not a medical device** — with clear disclaimers throughout onboarding and settings.

---

## Slide 9 — Why Now

### Three converging tailwinds

**1. Mental health apps market: $8.6B → $35B+ by 2034** (19% CAGR)
- Employer and payer funding replacing pure D2C
- AI personalization is the #1 cited market opportunity

**2. On-device AI is finally viable on phones**
- llama.cpp, llama.rn, ExecuTorch enable sub-4B models on mobile
- Apple State of Mind APIs normalize on-device mood logging
- Academic research (EmoSApp, MoPHES, MindBridge) validates the approach in 2025

**3. Privacy regulation and user awareness at all-time high**
- GDPR, HIPAA enforcement accelerating
- App Store privacy nutrition labels favor zero-collection apps
- Gen Z and privacy-conscious professionals actively seek offline alternatives

**The window for a credible offline-first wellness brand is open now.**

---

## Slide 10 — Market Opportunity

### TAM · SAM · SOM

| Segment | Size | Oppuna fit |
|---|---|---|
| **TAM** — Global mental health apps | **~$8.6B (2026)** → $35–42B by 2034–35 | Privacy-first, offline-capable segment |
| **SAM** — Privacy-conscious wellness users (US + EU + India) | ~$2–3B addressable | No-login, offline, multilingual (EN/ES/HI) |
| **SOM** — Year 1–3 target | 50K–500K paid users | Android launch → iOS → employer wellness pilots |

**Beachhead personas:**
- Therapists & coaches who recommend private journaling tools
- Privacy professionals, journalists, and high-sensitivity roles
- Rural / low-connectivity users (India, Southeast Asia, travel)
- Parents seeking safe tools for teens (with appropriate age gating)

---

## Slide 11 — Business Model

### Multiple revenue paths — none require selling user data

| Model | Description | Timeline |
|---|---|---|
| **Freemium app** | Core offline features free; premium LLM models, themes, advanced insights | Launch |
| **One-time purchase** | "Pay once, own forever" — aligns with privacy brand | Launch |
| **Oppuna Pro** | Subscription for bundled on-device models, voice STT, encrypted backup | Year 1 |
| **B2B / Employer wellness** | White-label or seat license — zero data leaves employee devices | Year 2 |
| **Clinical partnerships** | Licensed screening tools (PHQ-9/GAD-7 style) for community health workers | Year 2–3 |

**Key principle:** Revenue never depends on data monetization. That's the brand.

---

## Slide 12 — Competitive Landscape

| | **Oppuna** | Calm / Headspace | Wysa / Woebot | BetterHelp / Talkspace |
|---|---|---|---|---|
| Fully offline | ✅ | ❌ | ❌ | ❌ |
| Zero data collection | ✅ | ❌ | ❌ | ❌ |
| On-device AI chat | ✅ | ❌ | Cloud AI | Human (cloud) |
| Journal + mood + tools | ✅ | Partial | Partial | ❌ |
| Crisis detection | ✅ | ❌ | Partial | ✅ (human) |
| No account required | ✅ | ❌ | ❌ | ❌ |
| Price | Free / low | $70–100/yr | Freemium + B2B | $260+/mo |

**Oppuna owns the "offline + private + AI companion" quadrant — currently unoccupied at production quality.**

---

## Slide 13 — Traction & Product Status

### Built. Shipped. Store-ready.

| Milestone | Status |
|---|---|
| v1.0.0 production Android APK & AAB | ✅ Shipped |
| 18 feature-complete screens | ✅ Done |
| Layered AI architecture (safety → LLM → fallback) | ✅ Done |
| llama.rn on-device LLM integration | ✅ Done |
| Crisis safety flow | ✅ Done |
| Biometric / device-credential app lock | ✅ Done |
| Multilingual (EN, ES, HI) | ✅ Done |
| Unit tests (AI, crisis, repositories) | ✅ Done |
| Privacy policy + hosted site + GitHub Pages | ✅ Done |
| Google Play listing copy + feature graphic | ✅ Ready |
| iOS build configuration | 🔧 Configured, pending store submit |

**This is not a prototype. It's a launch-ready product.**

---

## Slide 14 — Technology Stack

### Modern, maintainable, offline-native

- **React Native 0.83 + Expo SDK 55 + TypeScript (strict)**
- **expo-sqlite** — local structured storage with versioned migrations
- **llama.rn** — on-device LLM with streaming and GPU acceleration
- **Zustand + AsyncStorage** — preferences without a backend
- **React Navigation** — native-stack + bottom tabs
- **Reanimated + SVG** — breathing animations and mood charts

**Architecture ready for:**
- SQLCipher encrypted storage
- On-device speech-to-text
- Larger bundled LLM models
- iOS App Store submission

---

## Slide 15 — Go-to-Market

### Phase 1: Privacy-native community launch

**Channels:**
- Product Hunt, Hacker News, r/privacy, r/mentalhealth
- Therapist & coach referral program (privacy-safe tool recommendation)
- Mental health influencer partnerships (authenticity over ads)
- App Store / Play Store ASO — keywords: offline, private, journal, mood

**Messaging:**
> *"The wellness app that can't spy on you — by design."*

### Phase 2: Expand reach
- iOS App Store launch
- Hindi/Spanish market campaigns (India, LATAM)
- Employer wellness pilot (device-local = no HIPAA data processor)

### Phase 3: Platform
- Licensed clinical screening modules
- API-free "companion SDK" for healthcare integrators who need on-device AI

---

## Slide 16 — Roadmap

| Quarter | Deliverable |
|---|---|
| **Q3 2026** | Google Play launch · iOS submit · bundled small LLM model |
| **Q4 2026** | On-device speech-to-text · SQLCipher encryption · widget |
| **Q1 2027** | Oppuna Pro subscription · advanced insights · Apple Watch |
| **Q2 2027** | Employer wellness pilot · PHQ-9/GAD-7 screening module |
| **2027+** | Clinical validation study · regional language expansion · B2B white-label |

---

## Slide 17 — Team

### [Founder Name] — CEO & Product
*[Background: product, mental health advocacy, mobile development]*

### [Co-founder / CTO Name] — Engineering
*[Background: React Native, on-device ML, security]*

### Advisors (target)
- Clinical psychologist (crisis protocol review)
- Privacy / security researcher (architecture audit)
- Growth advisor (consumer health apps)

> **Note for presenter:** Customize this slide with actual team bios before investor meetings.

---

## Slide 18 — Financial Projections (Illustrative)

### Path to $5M ARR by Year 3

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Downloads | 100K | 500K | 1.5M |
| Paid conversion | 5% | 7% | 8% |
| ARPU (annual) | $24 | $30 | $36 |
| **Revenue** | **$120K** | **$1.05M** | **$4.3M** |
| B2B pilots | — | 3 | 15 |

*Assumes freemium + Oppuna Pro at $4.99/mo or $29.99/yr. B2B seat pricing $3–8/user/mo.*

**Unit economics advantage:** Near-zero marginal cost per user (no cloud AI, no storage, no support infrastructure for data breaches).

---

## Slide 19 — The Ask

# Raising **$[X]M** Seed

### Use of funds

| Allocation | % | Purpose |
|---|---|---|
| **Product & engineering** | 45% | iOS launch, on-device STT, encrypted storage, LLM optimization |
| **Go-to-market** | 30% | ASO, community launch, therapist referral, content |
| **Clinical & compliance** | 15% | Crisis protocol review, privacy audit, age-rating guidance |
| **Operations & runway** | 10% | Legal, accounting, 18-month runway |

### What investors get
- Launch-ready product with defensible privacy architecture
- First-mover in offline AI wellness at consumer quality
- Clear path to B2B employer wellness without HIPAA data liability
- Category brand: **"Oppuna = private wellness"**

---

## Slide 20 — Vision

# A world where getting mental wellness support
# doesn't mean giving up your privacy.

**Oppuna** — from *Magnolia champaca*, a flower associated with calm and clarity across cultures.

We believe the most private thoughts deserve the most private technology.

**Peace of mind. On your terms. Offline.**

---

## Slide 21 — Contact & Appendix

**Oppuna**
- App: `com.oppuna.app`
- Version: 1.0.0
- Privacy: [Hosted privacy policy]
- Repo: [GitHub — if applicable]

**Appendix available:**
- Technical architecture deep-dive
- Crisis detection methodology
- Competitive feature matrix
- App Store listing & screenshots
- Unit test coverage report

**Thank you.**

---

## Speaker Notes (Quick Reference)

**Slide 3:** Lead with the trust gap — users want help but fear surveillance. Mozilla stat is the hook.

**Slide 7:** This is the diligence slide. Offer to walk investors through `networkGuard.ts` and the blocked INTERNET permission.

**Slide 9:** Emphasize that on-device LLM research went mainstream in 2025 — we're not early science, we're early product.

**Slide 13:** Demo the APK live. Show airplane mode. Create a mood entry. Chat. Export data. Delete all data.

**Slide 19:** Customize the raise amount and use-of-funds before presenting. Default placeholders are intentional.
