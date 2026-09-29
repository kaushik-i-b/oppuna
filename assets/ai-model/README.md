# On-device LLM model (Play Asset Delivery source)

Place `model.gguf` in this folder before creating a production Android App Bundle.

```
assets/ai-model/model.gguf
```

## Current production model

| Field | Value |
| --- | --- |
| Model | **Qwen2.5 1.5B Instruct** |
| Quant | Q4_K_M |
| Source | `bartowski/Qwen2.5-1.5B-Instruct-GGUF` → `Qwen2.5-1.5B-Instruct-Q4_K_M.gguf` |
| Packaged as | `model.gguf` (~941 MB) |
| Why this delivery | On-demand Play Asset Delivery, so the base install stays small |

During `npx expo prebuild` / EAS Build, the Oppuna config plugin copies this file
into the on-demand asset pack `ai_model_asset_pack`. Users download it from
Settings. It is not part of the initial install.

Update `config/local-model.json` with the matching `sha256` and `expectedSize`
before release (already set for the Qwen file above).

Never commit the GGUF binary to git.
