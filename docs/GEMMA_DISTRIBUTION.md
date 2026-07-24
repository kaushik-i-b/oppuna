# Gemma on-device distribution

Oppuna ships **Google Gemma 3 1B Instruct (Q4_K_M)** for fully offline inference via **llama.rn** (llama.cpp).

## Model identity

| Field | Value |
| --- | --- |
| Config id | `oppuna-gemma3-1b-it-q4km` |
| Display name | Gemma 3 1B Instruct (Q4_K_M) |
| File in PAD pack | `model.gguf` |
| Expected size | ~806,058,496 bytes (~769 MB) |
| SHA-256 | Configured in `src/config/localModel.ts` |
| Context default | 4096 tokens (may be lowered per device tier) |

## Packaging (production Android)

1. Place the GGUF at `assets/ai-model/model.gguf` (gitignored).
2. `plugins/withAiModelAssetPack.js` copies it into `android/ai_model_asset_pack/` at prebuild.
3. Google Play delivers the pack **at install time** (`deliveryType = install-time`).
4. Native module `OppunaModelAsset` resolves a filesystem path for llama.rn mmap.

Development / sideload: copy a GGUF to `{documentDirectory}models/model.gguf`.

## Verification pipeline

Before first load (`src/services/modelAssetService.ts`):

1. Resolve path (PAD → dev folder)
2. Exists + minimum size + expected byte size
3. SHA-256 on first install, app/model version change, or suspected corruption
4. Store verification metadata in AsyncStorage for faster subsequent launches

Failure states:

- `corrupted` — hash/size mismatch
- `unavailable` — file not found
- `unsupported-device` — insufficient RAM
- `failed` — provider init error / timeout

## Runtime behavior

- Initialization timeout: `LOCAL_MODEL_CONFIG.initTimeoutMs` (120s)
- Generation timeout: `LOCAL_MODEL_CONFIG.responseTimeoutMs` (60s)
- Safety engine always runs **before** inference
- Response validator may reject model output → rule engine fallback
- Crisis routing cannot be overridden by the model

## Licensing

Bundled offline notices: **Settings → Legal → Third-Party Licenses / Gemma Information**

- `assets/licenses/GEMMA-NOTICE.txt`
- `assets/licenses/GEMMA-TERMS-REFERENCE.md`
- llama.rn / llama.cpp MIT licenses

Regenerate from installed packages:

```bash
npm run sync:licenses
```

## Manual QA (required before Play production)

- [ ] Install production AAB via internal testing track
- [ ] Airplane mode: first chat response succeeds or falls back safely
- [ ] Corrupt GGUF (dev build): app does not crash; guided mode works
- [ ] 4 GB / 6 GB / 8+ GB devices: record init time, latency, memory (see Play checklist)
