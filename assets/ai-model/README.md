# On-device LLM model (Play Asset Delivery source)

Place `model.gguf` in this folder before creating a production Android App Bundle.

```
assets/ai-model/model.gguf
```

During `npx expo prebuild` / EAS Build, the Oppuna config plugin copies this file
into the install-time asset pack `ai_model_asset_pack`.

Update `src/config/localModel.ts` with the matching `sha256` and `expectedSize`
before release.

Never commit the GGUF binary to git.
