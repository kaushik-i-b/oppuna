# Oppuna production readiness

This document tracks software production-readiness work for the offline-first Oppuna Android app (Qwen on-device LLM).

## Architecture guarantees (must not regress)

- Wellness data and AI inference stay on the user's device
- No backend, cloud LLM, Ollama, analytics, or remote logging
- `android.permission.INTERNET` blocked in production configuration
- Android Auto Backup disabled (`allowBackup=false` + exclusion rules)
- Crisis/safety routing runs before generative inference
- Guided offline fallbacks when the on-device model is unavailable
- Production weights are **Qwen2.5 1.5B Instruct Q4_K_M** only (no Gemma reintroduction)

## Automated release gates

### Pull requests / ordinary CI

```bash
npm run verify:ci
```

May report `SKIPPED` for the large GGUF binary when that artifact is intentionally unavailable in Git/CI. `SKIPPED` is not `PASS`.

### Release machines (strict — no skips)

```bash
npm run verify:production
OPPUNA_PRODUCTION_VALIDATE=1 npm run verify:model
npm run verify:aab -- path/to/fresh-qwen-release.aab
```

`verify:production` requires the real `assets/ai-model/model.gguf`, matching size/SHA/GGUF header/architecture, and Qwen Apache-2.0 license assets.

Individual checks:

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript strict validation |
| `npm run lint` | ESLint |
| `npm test` | Jest unit/integration tests |
| `npm run verify:secrets` | No committed keystores/passwords |
| `npm run verify:offline` | Offline-only app configuration |
| `npm run verify:privacy-config` | Android backup disabled |
| `npm run verify:no-stale-model` | No prohibited Gemma refs in production-critical paths |
| `npm run verify:model` | Qwen GGUF / PAD / license assets (strict by default) |
| `npm run verify:aab` | Inspect a built AAB artifact (BLOCKED if bundletool unavailable for required checks) |
| `npm run inspect:android-release` | SDK targets, package id, manifest |
| `npm run verify:ci` | PR/CI pipeline (skips allowed) |
| `npm run verify:production` | Strict release pipeline (no skips) |

Model metadata source of truth: `config/local-model.json`

### Version codes for Play uploads

Current `app.json` version is **2.0.0** with `android.versionCode` **7**. Any future Play upload must use a `versionCode` **strictly greater** than every previously uploaded Play artifact. Do not reuse an already-uploaded versionCode. `verify:aab` compares the **actual AAB** versionCode/versionName against `app.json` when bundletool is available.

**Important:** Older files under `release/*.aab` may be **pre-Qwen / obsolete** (wrong model size, obsolete Gemma license assets). Never treat those as production PASS — rebuild after the Qwen cutover and re-run `verify:aab`.

## Key documentation

- `docs/QWEN_MODEL.md` — exact model identity
- `docs/PRODUCTION_SIGNING.md` — upload keys, Play App Signing, rotation
- `docs/DATA_PROTECTION.md` — storage model and limitations
- `docs/QWEN_DISTRIBUTION.md` — model packaging and verification
- `docs/PLAY_STORE_RELEASE_CHECKLIST.md` — human release checklist
- `docs/PLAY_MODEL_VALIDATION.md` — internal-track model validation

## Development-only diagnostics

In `__DEV__` builds: **Settings → AI diagnostics (dev)** and **Production readiness (dev)** show real local state (model name, presence, integrity, AI state, last response source). Never invent a PASS.

## Screenshot protection

Sensitive screens use Android `FLAG_SECURE` via `useSecureScreen()`:

- App Lock gate
- Private chat
- Journal editor
- Data export

Tradeoff: users cannot screenshot these surfaces; screen recording is blocked on many devices. This is intentional for wellness privacy.
