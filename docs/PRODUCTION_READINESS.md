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

### Pull requests / ordinary CI

```bash
npm run verify:ci
```

May report `SKIPPED` for the large GGUF binary and authoritative Gemma terms when those artifacts are intentionally unavailable in Git/CI. `SKIPPED` is not `PASS`.

### Release machines (strict — no skips)

```bash
npm run verify:production
OPPUNA_PRODUCTION_VALIDATE=1 npm run verify:model
npm run verify:aab -- path/to/fresh-release.aab
```

`verify:production` requires the real `assets/ai-model/model.gguf`, matching size/SHA/GGUF header, and authoritative `GEMMA-TERMS-OF-USE.txt`.

Individual checks:

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript strict validation |
| `npm run lint` | ESLint |
| `npm test` | Jest unit/integration tests |
| `npm run verify:secrets` | No committed keystores/passwords |
| `npm run verify:offline` | Offline-only app configuration |
| `npm run verify:privacy-config` | Android backup disabled |
| `npm run verify:model` | Gemma / PAD / license assets (strict by default) |
| `npm run verify:aab` | Inspect a built AAB artifact |
| `npm run inspect:android-release` | SDK targets, package id, manifest |
| `npm run verify:ci` | PR/CI pipeline (skips allowed) |
| `npm run verify:production` | Strict release pipeline (no skips) |

Model metadata source of truth: `config/local-model.json`

### Version codes for Play uploads

Current `app.json` version is **2.0.0** with `android.versionCode` **5**. Any future Play upload must use a `versionCode` **strictly greater** than every previously uploaded Play artifact. Do not reuse an already-uploaded versionCode. `verify:aab` compares the **actual AAB** versionCode/versionName against `app.json` when bundletool is available.

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
