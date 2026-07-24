# Oppuna production readiness

This document tracks software production-readiness work for the offline-first Oppuna Android app.

## Architecture guarantees (must not regress)

- Wellness data and AI inference stay on the user's device
- No backend, cloud LLM, Ollama, analytics, or remote logging
- `android.permission.INTERNET` blocked in production configuration
- Android Auto Backup disabled (`allowBackup=false` + exclusion rules)
- Crisis/safety routing runs before generative inference
- Guided offline fallbacks when the on-device model is unavailable

## Automated release gates

Run locally or in CI:

```bash
npm run verify:production
```

Individual checks:

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript strict validation |
| `npm run lint` | ESLint |
| `npm test` | Jest unit/integration tests |
| `npm run verify:secrets` | No committed keystores/passwords |
| `npm run verify:offline` | Offline-only app configuration |
| `npm run verify:privacy-config` | Android backup disabled |
| `npm run verify:model` | Gemma / PAD / license assets |
| `npm run inspect:android-release` | SDK targets, package id, manifest |

## Key documentation

- `docs/PRODUCTION_SIGNING.md` — upload keys, Play App Signing, rotation
- `docs/DATA_PROTECTION.md` — storage model and limitations
- `docs/GEMMA_DISTRIBUTION.md` — model packaging and verification
- `docs/PLAY_STORE_RELEASE_CHECKLIST.md` — human release checklist

## Development-only diagnostics

In `__DEV__` builds: **Settings → Production readiness (dev)** runs a local self-check (PASS/WARN/FAIL) without network access.

## Screenshot protection

Sensitive screens use Android `FLAG_SECURE` via `useSecureScreen()`:

- App Lock gate
- Private chat
- Journal editor
- Data export

Tradeoff: users cannot screenshot these surfaces; screen recording is blocked on many devices. This is intentional for wellness privacy.
