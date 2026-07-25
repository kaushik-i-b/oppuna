# Qwen on-device distribution

Oppuna ships **Qwen2.5 1.5B Instruct (Q4_K_M)** for fully offline inference via **llama.rn** (llama.cpp).

Identity details: [`docs/QWEN_MODEL.md`](./QWEN_MODEL.md) and [`config/local-model.json`](../config/local-model.json).

## Model identity

| Field | Value |
| --- | --- |
| Config id | `oppuna-qwen25-1_5b-instruct-q4km` |
| Display name | Qwen2.5 1.5B Instruct (Q4_K_M) |
| File in PAD pack | `model.gguf` |
| Expected size | 986,048,768 bytes (~941 MB) |
| SHA-256 | Configured in `config/local-model.json` (do not invent) |
| Context default | 4096 tokens (may be lowered per device tier) |
| Upstream GGUF | `bartowski/Qwen2.5-1.5B-Instruct-GGUF` → `Qwen2.5-1.5B-Instruct-Q4_K_M.gguf` |
| License | Apache-2.0 |

## Packaging (production Android)

1. Place the GGUF at `assets/ai-model/model.gguf` (gitignored).
2. `plugins/withAiModelAssetPack.js` copies it into `android/ai_model_asset_pack/` at prebuild.
3. Google Play delivers the pack **at install time** (`deliveryType = install-time`).
4. Native module `OppunaModelAsset` opens the asset via **AssetManager**, copies off the UI thread to `filesDir/ai-model/model.gguf.tmp`, verifies size/GGUF/SHA, then **atomically moves** to `model.gguf` for llama.rn mmap.

Development / sideload: copy a GGUF to `{documentDirectory}models/model.gguf`.

## Verification pipeline

Before first load (`src/services/modelAssetService.ts`):

1. Resolve path (PAD AssetManager → private copy → dev folder)
2. Exists + minimum size + expected byte size
3. SHA-256 on first install, app/model version change, or suspected corruption (trusted verification record may authorize selective skip)
4. Store verification metadata in AsyncStorage for faster subsequent launches
5. `npm run verify:model` also enforces Play’s **1 GB** install-time pack ceiling and GGUF architecture=`qwen2`

Failure states:

- `corrupted` — hash/size mismatch
- `unavailable` — file not found
- `unsupported-device` — insufficient RAM (< ~3 GB)
- `failed` — provider init error / timeout
- `insufficient-storage` — not enough free space for private copy

## Runtime behavior

- Initialization timeout: `LOCAL_MODEL_CONFIG.initTimeoutMs` (120s)
- Generation timeout: `LOCAL_MODEL_CONFIG.responseTimeoutMs` (60s)
- Safety engine always runs **before** inference
- Response validator may reject model output → rule engine fallback
- Crisis routing cannot be overridden by the model

## Licensing

Bundled offline notices: **Settings → Legal → Third-Party Licenses / Qwen Information**

- `assets/licenses/QWEN-NOTICE.txt`
- `assets/licenses/QWEN-LICENSE.txt` (Apache License, Version 2.0)
- llama.rn / llama.cpp MIT licenses

```bash
npm run sync:licenses
```

## Historical / obsolete packaging

Pre-Qwen release AABs under `release/` may still contain a smaller legacy GGUF and obsolete Gemma license filenames. Those artifacts are **stale** — rebuild a fresh production AAB after placing the Qwen `model.gguf`, then run `npm run verify:aab -- <path>`.

## Manual QA (required before Play production)

- [ ] Install **fresh** production AAB via internal testing track
- [ ] Airplane mode: first chat response succeeds or falls back safely
- [ ] Corrupt GGUF (dev build): app does not crash; guided mode works
- [ ] 4 GB / 6 GB / 8+ GB devices: record init time, latency, memory (see Play checklist)
