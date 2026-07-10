# Oppuna — Investor Pitch Deck

> **Private mental wellness support, offline on your phone.**
>
> Slide-by-slide copy for Google Slides, Keynote, or PowerPoint. Open `docs/pitch-deck.html` in a browser for a ready-to-present version.

---

## Slide 1 — Title

**Oppuna** 🌿

Private mental wellness support, offline on your phone.

*Peace of mind. On your terms. Offline.*

**kaushik Itagi** · Founder  
[github.com/kaushik-i-b/oppuna](https://github.com/kaushik-i-b/oppuna)

---

## Slide 2 — The Problem

### Mental wellness apps ask users to trade privacy for help.

- **1 in 4** people experience a mental health condition each year — yet most digital tools require accounts, cloud sync, and constant connectivity.
- Users fear their **most vulnerable thoughts** being stored on corporate servers, analyzed, or leaked.
- Cloud-based AI companions (Woebot, Replika, etc.) route intimate conversations through **third-party APIs**.
- In **low-connectivity regions** — rural India, travel, crisis situations — wellness apps simply stop working.
- Regulatory pressure (GDPR, HIPAA-adjacent concerns) makes **privacy-by-policy** insufficient; users want privacy-by-architecture.

> *"I want help, but I don't want anyone else to know what I'm going through."*

---

## Slide 3 — The Solution

### Oppuna: A fully offline mental wellness companion.

| Promise | How |
|---------|-----|
| **No account** | Open and use immediately |
| **No cloud** | Zero servers, zero sync |
| **No internet** | Works in airplane mode |
| **No tracking** | No analytics, no ads, no telemetry |

Everything — journals, moods, chat, voice notes — stays **on the device, under the user's control**.

Oppuna is not a medical device. It provides **supportive wellness guidance** with evidence-based techniques (CBT, mindfulness, grounding) and local crisis resource routing.

---

## Slide 4 — Product

### One calm app. Eight wellness tools. Zero data leaving the phone.

| Feature | What it does |
|---------|--------------|
| **Offline AI companion** | Mood-aware chat with CBT, mindfulness, and grounding responses |
| **Crisis safety** | Local distress detection → dedicated crisis screen with regional helplines |
| **Mood tracker** | 5 moods, intensity scale, tags, weekly insights chart |
| **Journal** | Daily, gratitude, thought records, trigger reflections |
| **Breathing** | 4-4-6, box breathing, 5-minute calm with animated guide |
| **Grounding** | Guided 5-4-3-2-1 senses exercise |
| **Sleep support** | Wind-down checklist + spoken TTS narration |
| **Voice notes** | Private audio stored locally |

**18 screens** · **3 languages** (EN, ES, HI) · **Dark/light themes** · **Biometric app lock**

---

## Slide 5 — How It Works

### Privacy by architecture, not policy.

```
User → Oppuna App → SQLite (local) + On-device AI → Response
                         ↓
                  Network Guard (blocks all outbound requests)
```

**Three-layer AI pipeline:**
1. **Crisis detection** — suicide, self-harm, abuse, medical emergency → crisis screen
2. **On-device LLM** (optional GGUF via llama.rn) — validated responses
3. **Rule-based fallback** — deterministic CBT/mindfulness engine (always available)

**Tech stack:** React Native 0.83 · Expo SDK 55 · TypeScript · SQLite · Zustand

Android `INTERNET` permission is **blocked at the manifest level**. Production builds cannot reach the internet — enforced in code, not just promised in a privacy policy.

---

## Slide 6 — Market Opportunity

### A large, fast-growing market with a trust gap.

| Segment | Size (2026 est.) | CAGR |
|---------|------------------|------|
| Mental health apps | **$8.6B – $16B** | ~16–19% |
| Wellness apps (broader) | **$14.7B** | ~15% |

**Key trends:**
- Rising mental health awareness globally, especially post-pandemic
- **Asia-Pacific** is the fastest-growing region; India mental health app market projected ~$0.1B+ by 2026
- Employer wellness programs and digital health adoption accelerating
- AI-driven therapy creating demand — but also **privacy backlash**

**Oppuna's wedge:** Privacy-conscious users, low-connectivity markets, and anyone who wants wellness support without a cloud account.

*Sources: Fortune Business Insights, Coherent Market Insights, The Business Research Company (2025–2026 reports)*

---

## Slide 7 — Business Model

### Freemium → Premium, with B2B expansion.

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Core wellness tools, rule-based AI, mood/journal/breathing |
| **Premium** | ~$4.99/mo or $39.99/yr | On-device LLM, advanced insights, encrypted storage, STT voice mode |
| **Lifetime** | ~$79.99 one-time | All premium features, forever offline |

**B2B / Enterprise (Year 2+):**
- White-label for **employer wellness programs** (no employee data leaves devices)
- **NGO / government** partnerships for offline mental health in rural/low-connectivity regions
- **Clinical adjacency** — referral partnerships (not diagnosis/treatment)

**Why users pay:** Premium on-device AI and encryption are genuine upgrades — not artificial paywalls on data they've already shared with us (we never have their data).

---

## Slide 8 — Competitive Landscape

| | Oppuna | Calm / Headspace | Woebot / Replika | Day One / Moodnotes |
|---|--------|------------------|------------------|---------------------|
| **Fully offline** | ✅ | ❌ | ❌ | Partial |
| **No account required** | ✅ | ❌ | ❌ | ❌ |
| **AI companion** | ✅ (on-device) | ❌ | ✅ (cloud) | ❌ |
| **Crisis safety** | ✅ (local) | Limited | Cloud-routed | ❌ |
| **Privacy by architecture** | ✅ | Policy only | Policy only | Policy only |
| **Data never leaves device** | ✅ | ❌ | ❌ | ❌ |

**Our moat:** Architectural privacy (network guard + blocked INTERNET permission) is **hard to retrofit** onto cloud-first apps. Oppuna is built offline-first from day one.

---

## Slide 9 — Traction & Status

### Production-ready v1.0 — ready to launch.

| Milestone | Status |
|-----------|--------|
| **v1.0.0 built** | ✅ Complete |
| **Android AAB signed** | ✅ Ready for Google Play |
| **EAS production pipeline** | ✅ Configured |
| **18 screens / full feature set** | ✅ Shipped |
| **Unit tests** | ✅ AI engine, crisis detection, DB |
| **Privacy policy site** | ✅ Live (GitHub Pages) |
| **App Store listing copy** | ✅ Drafted |
| **User downloads** | Pre-launch |

**No analytics by design** — we will measure traction through store metrics, user reviews, and optional in-app feedback (opt-in, local-only export).

---

## Slide 10 — Roadmap

### Built to grow without compromising privacy.

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Launch** | Q3 2026 | Google Play release, App Store submission |
| **v1.1** | Q4 2026 | On-device LLM (GGUF), SQLCipher encryption, full biometric lock |
| **v1.2** | Q1 2027 | On-device speech-to-text, 5+ languages |
| **v2.0** | Q2 2027 | Premium tier, advanced insights, wearable integration |
| **B2B pilot** | H2 2027 | Employer wellness white-label, NGO partnerships |

Architecture is **roadmap-ready**: LLM, STT, and encrypted storage plug into existing interfaces without architectural rewrites.

---

## Slide 11 — Team

### kaushik Itagi — Founder & Builder

- Full-stack mobile engineer — designed, built, and shipped Oppuna end-to-end
- React Native · Expo · TypeScript · on-device AI · SQLite
- Product vision: **mental wellness should not require surrendering privacy**

**Hiring with investment:**
- Growth / marketing lead (app store optimization, community)
- Clinical advisor (wellness content validation, crisis protocol review)
- Part-time designer (brand, onboarding, store assets)

*Advisors and clinical partners — to be named.*

---

## Slide 12 — The Ask

### Raising **$500K – $750K** pre-seed

| Use of funds | Allocation |
|--------------|------------|
| **Launch & growth** | 35% — App Store/Play marketing, ASO, content |
| **Engineering** | 30% — LLM integration, encryption, STT, iOS polish |
| **Clinical & safety** | 15% — Advisor, crisis protocol audit, content review |
| **Operations & legal** | 10% — Entity formation, privacy compliance, insurance |
| **Runway buffer** | 10% — 18-month runway to Series A milestones |

**18-month milestones:**
- 50K+ downloads across Android + iOS
- Premium conversion ≥ 5%
- B2B pilot with 1–2 employer or NGO partners
- On-device LLM shipped and validated

---

## Slide 13 — Why Now, Why Oppuna

1. **On-device AI is finally viable** — llama.rn and small GGUF models run on modern phones
2. **Privacy regulation is tightening** — users and regulators demand more than privacy policies
3. **Mental health demand is surging** — but trust in cloud apps is eroding
4. **India + APAC are underserved** — Hindi support, India-default crisis helplines, offline-first for low connectivity
5. **Oppuna is built** — not a slide deck idea; v1.0 is production-ready today

---

## Slide 14 — Closing

### Oppuna 🌿

**Peace of mind. On your terms. Offline.**

Your mind deserves a private space.

**Contact:** kaushikitagib@yahoo.com  
**Product:** [github.com/kaushik-i-b/oppuna](https://github.com/kaushik-i-b/oppuna)  
**Privacy:** [kaushik-i-b.github.io/oppuna](https://kaushik-i-b.github.io/oppuna/)

---

## Appendix — Speaker Notes

### Slide 2 (Problem)
Emphasize the emotional angle: people in distress are asked to create accounts and send their deepest thoughts to servers. Oppuna removes that friction entirely.

### Slide 5 (Architecture)
If technical investors ask: the network guard wraps `fetch` and `XMLHttpRequest` and rejects remote hosts in production. Android INTERNET permission is explicitly blocked in `app.json`. This is defense-in-depth.

### Slide 7 (Business Model)
Be clear this is proposed, not validated. The free tier is genuinely useful (rule-based AI works well). Premium is for power users who want local LLM and encryption.

### Slide 9 (Traction)
Be transparent: pre-launch, no user metrics. The product is real and shippable. That's the traction story for pre-seed.

### Slide 12 (Ask)
Adjust the raise amount based on your actual fundraising goals. $500K–$750K pre-seed is a reasonable range for a solo-founder, production-ready MVP in health/wellness.
