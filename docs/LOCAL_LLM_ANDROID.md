# On-device Local LLM (Android)

Oppuna runs a private mental-wellness companion entirely on the device using:

- **llama.rn** — React Native binding
- **llama.cpp** — native inference runtime
- **Quantized GGUF model** — delivered by Google Play (install-time asset pack)
- **SafetyEngine** — deterministic crisis detection *before* inference
- **Response validator** — rejects unsafe model output
- **Rule-based fallback** — always available if the model is missing or fails

Oppuna does **not** use Ollama, Termux, localhost HTTP servers, cloud LLM APIs, or runtime Hugging Face downloads.

## Architecture

```
Google Play
  └── Oppuna Android app
        └── Install-time Play Asset Delivery pack (ai_model_asset_pack)
              └── model.gguf

User message
  → SafetyEngine (crisis? → reviewed safety reply)
  → ContextBuilder (bounded prompt)
  → LocalLLMProvider (llama.rn → llama.cpp → model.gguf)
  → Streaming tokens → Chat UI
  → Output validator
  → Persist assistant message
```

If initialization or generation fails, Oppuna falls back to the deterministic rule engine. Chat never breaks.

## Key source files

| Area | Path |
|------|------|
| Model config | `src/config/localModel.ts` |
| Provider interface | `src/ai/providers/LocalLLMProvider.ts` |
| llama.rn provider | `src/ai/providers/LlamaRnProvider.ts` |
| Fake provider (tests) | `src/ai/providers/FakeLocalLLMProvider.ts` |
| Model lifecycle | `src/ai/modelManager.ts` |
| Context budget | `src/ai/contextBuilder.ts` |
| Orchestrator | `src/ai/engine.ts` |
| PAD path + integrity | `src/services/modelAssetService.ts` |
| Device tiering | `src/services/deviceCapabilityService.ts` |
| Expo PAD plugin | `plugins/withAiModelAssetPack.js` |
| Model staging dir | `assets/ai-model/` (GGUF gitignored) |

## Dependency setup

```bash
npm install
```

`llama.rn` is already listed in `package.json` and configured in `app.json` via the `llama.rn` Expo config plugin.

Expo Go **cannot** run llama.rn (native code). Use a development build or production AAB.

## Expo prebuild / native Android

```bash
npx expo prebuild --platform android
```

This regenerates `android/` and runs:

1. `llama.rn` native integration
2. `./plugins/withAiModelAssetPack.js` — creates `ai_model_asset_pack`, Gradle wiring, and the `OppunaModelAsset` native module

## Play Asset Delivery structure

After prebuild:

```
android/
  app/
    ...
  ai_model_asset_pack/
    build.gradle          # install-time delivery
    src/main/assets/
      model.gguf          # copied from assets/ai-model/ when present
```

Delivery mode: **install-time** — Google Play installs the model with the app. No extra user step, no third-party apps.

### Where `model.gguf` goes (developer workflow)

1. Obtain a quantized GGUF suitable for mobile (e.g. 1B–3B Q4_K_M).
2. Place it at:

   ```
   assets/ai-model/model.gguf
   ```

3. Compute SHA-256 and file size:

   ```bash
   sha256sum assets/ai-model/model.gguf
   stat -c%s assets/ai-model/model.gguf
   ```

4. Update `src/config/localModel.ts`:

   ```ts
   export const LOCAL_MODEL_CONFIG = {
     id: 'oppuna-local-v1',
     fileName: 'model.gguf',
     version: '1',
     sha256: '<hex digest>',
     expectedSize: <bytes>,
     contextSize: 4096,
     // ...
   };
   ```

5. Do **not** commit the GGUF (`*.gguf` is gitignored).

## Model path resolution

At runtime `modelAssetService.getInstalledModelPath()`:

1. **Android production:** native `OppunaModelAsset.getInstalledModelPath(pack, file)` uses Play `AssetPackManager.getPackLocation()` and returns a real filesystem path for llama.cpp mmap.
2. **Development / sideload:** `{documentDirectory}models/model.gguf` (or any `*.gguf` in that folder).

The JS layer always receives a path (or `file://` URI) that llama.rn can open — never a Metro `require()` asset id.

## Model integrity

`verifyModelIntegrity()`:

- Always checks existence + minimum plausible size (+ exact `expectedSize` when configured).
- Full SHA-256 (native streaming hasher when available) on:
  - first install
  - app version change
  - model version / id change
  - size mismatch
  - suspected corruption / explicit force
- Later launches use trusted AsyncStorage metadata + size/version checks (avoids re-hashing multi-GB files every cold start).

## Device capability

`deviceCapabilityService` returns `low | medium | high` with recommended:

- context size
- GPU layers (Android defaults to **0** — OpenCL varies widely)
- max generation tokens
- thread count

Failed loads never crash the app; the UI shows a friendly “guided responses” state.

## Streaming UX

Chat buffers tokens (~40ms) before React state updates, supports cancel, clears partial placeholders on error/crisis, and cancels generation when the app backgrounds or the screen unmounts.

Final assistant text is persisted only after generation completes (or crisis/safety replacement).

## Privacy

- No cloud LLM inference
- No API keys
- No conversation / journal upload
- Model delivered by Google Play at install time
- `android.permission.INTERNET` remains blocked in `app.json`

## Build / run commands

### Typecheck, lint, tests

```bash
npm run typecheck
npm run lint
npm test
```

### Development build (device/emulator)

```bash
npx expo prebuild --platform android
npx expo run:android
```

For local testing without PAD, copy a GGUF to the app documents `models/` directory on device.

### Production AAB (Play Store)

```bash
# 1. Place model
cp /path/to/quantized.gguf assets/ai-model/model.gguf

# 2. Update sha256 / expectedSize / version in src/config/localModel.ts

# 3. Build app bundle (EAS)
npm run build:production
```

EAS runs prebuild on the build servers, so the config plugin packs the GGUF into the install-time asset pack inside the AAB.

### Local AAB testing with asset packs

Use [bundletool](https://github.com/google/bundletool) with `--local-testing` so install-time packs are present on a sideloaded build.

## Debugging

In `__DEV__` builds, Settings → **AI diagnostics (dev)** shows:

- model status / version / path
- provider id
- context size
- device tier
- init time / tokens/sec
- last error

No private conversation content is displayed.

## What cannot be completed without a real GGUF / Play environment

- End-to-end inference on a physical phone with the production model
- Measuring real tokens/sec and RAM for a specific GGUF
- Verifying Play Asset Delivery path resolution against a signed Play install
- Filling production `sha256` / `expectedSize` (requires the final binary)

CI unit tests mock `llama.rn` and use `FakeLocalLLMProvider` — they never load a multi-GB model.
