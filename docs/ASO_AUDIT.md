# Oppuna Google Play ASO Audit

**Date:** 6 August 2026  
**Scope:** Install-conversion readiness without medical overclaims  
**Architecture constraint:** Production Android blocks `INTERNET`; analytics must stay on-device.

---

## 1. Findings summary

| Area | Status | Notes |
| --- | --- | --- |
| App identity | Partial | Launcher name `Oppuna`; Play title needs Console update |
| Package | OK | `com.oppuna.care` |
| Store copy drafts | Weak | Exceeded Play limits; now replaced in `PLAY_STORE_LISTING.md` |
| Screenshots | OK | 10× 1080×1920 in `assets/play-store/screenshots/` |
| Feature graphic | OK | `assets/feature-image.png` (1024×500) |
| Localization | Partial | `en`, `hi`, `kn` (+ others); added `en-IN`; store listings localized in docs |
| Analytics | Missing → Local | No cloud SDK (by design); local event log implemented |
| In-app review | Missing → Added | `expo-store-review` after positive-use gates |
| Deep links / App Links | Absent | No intent filters; deferred |
| Fastlane | Absent | EAS-only (`eas.json`) |
| Website SEO | Stale → Updated | Titles, OG, JsonLd, use-case sections |
| Privacy URL | Inconsistent in docs | Canonical: `https://oppuna.com/privacy/` |

---

## 2. Current metadata (pre-change)

| Field | Value |
| --- | --- |
| `expo.name` | Oppuna |
| `android.package` | com.oppuna.care |
| `version` / `versionCode` | 2.1.0 / 9 (`app.json`) |
| Scheme | `oppuna` (no https App Links) |
| Offline | `blockedPermissions: INTERNET`, `offlineOnly: true` |

**Version drift:** `src/constants/app.ts` and website still showed `2.0.0` — aligned in this change set.

---

## 3. Policy risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| “AI therapist” / clinical cure claims | High | Forbidden in listing copy; disclaimers required |
| Therapy outcome claims | High | Use “designed to help prepare for sessions” only |
| Cloud analytics with journal text | High | Local events only; never log notes/body |
| Review prompt after crisis / awful mood | Medium | Explicit suppress rules in review service |
| Misleading download/rating claims | High | Not used anywhere |
| Inconsistent privacy URL in checklists | Low | Prefer `https://oppuna.com/privacy/` |

---

## 4. Gaps closed in this PR

- Play-ready titles / short / long descriptions + EN / en-IN / HI / KN listing copy (`docs/PLAY_STORE_LISTING.md`, `docs/play-store/listings/`)  
- Local analytics event API + wiring for activation funnel (`analyticsService`)  
- Google Play in-app review after meaningful positive use (`reviewPromptService` + `expo-store-review`)  
- Website metadata + use-case landing sections  
- Screenshot captions, feature graphic copy, promo text, A/B variants  
- Onboarding starts with language selection (Language → WellnessOnboarding)  
- Privacy copy clarified: no cloud analytics; local funnel events never include free text  

## 5. Still manual (Play Console)

- Paste title, short description, full description per locale  
- Upload screenshot order + captions  
- Feature graphic / promo text  
- Store listing experiments (A/B)  
- Privacy policy URL confirmation (`https://oppuna.com/privacy/`)  
- Content rating / Data safety form review  
- Note: local analytics cannot appear in Play Console funnels without a future export/opt-in bridge (intentionally offline) 
