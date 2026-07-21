# On-device LLM model (Play Asset Delivery source)

Place `model.gguf` in this folder before creating a production Android App Bundle.

```
assets/ai-model/model.gguf
```

## Current production model

| Field | Value |
| --- | --- |
| Model | **Google Gemma 3 1B Instruct** |
| Quant | Q4_K_M |
| Source | `bartowski/google_gemma-3-1b-it-GGUF` → `google_gemma-3-1b-it-Q4_K_M.gguf` |
| Packaged as | `model.gguf` (~769 MB) |
| Why this size | Fits under Google Play’s **1 GB** install-time asset pack limit |

During `npx expo prebuild` / EAS Build, the Oppuna config plugin copies this file
into the install-time asset pack `ai_model_asset_pack`.

Update `src/config/localModel.ts` with the matching `sha256` and `expectedSize`
before release (already set for the Gemma file above).

Never commit the GGUF binary to git.
