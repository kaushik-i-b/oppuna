# On-device Local LLM (Android)

Oppuna runs a private mental-wellness companion entirely on the device using:

- **llama.rn** — React Native binding
- **llama.cpp** — native inference runtime
- **Quantized GGUF model** — optional Google Play on-demand pack (not part of the initial install)
- **SafetyEngine** — deterministic crisis detection *before* inference
- **Response validator** — rejects unsafe model output
- **Rule-based fallback** — always available if the model is missing or fails

Oppuna does **not** use Ollama, Termux, localhost HTTP servers, or cloud LLM APIs. Chat inference stays on the device. The Qwen file itself is an extra download so the base app stays small: Play on-demand delivery, or the pinned Hugging Face file when Play delivery is unavailable. Journal text is not part of that download.

## Architecture

```
Google Play
  └── Oppuna Android app
        └── On-demand Play Asset Delivery pack (ai_model_asset_pack)
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
    build.gradle          # on-demand delivery
    src/main/assets/
      model.gguf          # copied from assets/ai-model/ when present
```

Delivery mode: **on-demand** — Google Play does not include the model in the initial install. Settings → Download on-device model fetches the pack. Sideload builds that cannot use Play fetch the pinned file from `downloadUrl` in `config/local-model.json` and reject it unless the size and SHA-256 match.

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

4. Update `config/local-model.json` (source of truth for size/SHA/id):

   ```json
   {
     "modelId": "oppuna-qwen25-1_5b-instruct-q4km",
     "displayName": "Qwen2.5 1.5B Instruct (Q4_K_M)",
     "fileName": "model.gguf",
     "version": "3",
     "sha256": "<hex digest>",
     "expectedSize": 986048768
   }
   ```

   Current production choice: **Qwen2.5 1.5B Instruct Q4_K_M** (~941 MB), delivered
   on demand so it is not part of the base install. Individual Play asset packs
   may be up to 1.5 GB.

5. Do **not** commit the GGUF (`*.gguf` is gitignored).

## Model path resolution

At runtime `modelAssetService.getInstalledModelPath()`:

1. **Already downloaded:** private `filesDir/ai-model/model.gguf`, or the installed on-demand pack file.
2. **Development / sideload:** `{documentDirectory}models/model.gguf` (or any `*.gguf` in that folder).
3. If none of those exist, the model is unavailable until the user downloads it. Guided replies still work.

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

On Android, bootstrap calls `warmDeviceMemoryEstimate()` which reads total RAM
via `OppunaModelAsset.getTotalMemoryBytes` (ActivityManager) so tiers reflect
the real device. Until that probe runs (or if it fails), Oppuna assumes a
conservative ~6 GB medium tier.

Failed loads never crash the app; the UI shows a friendly “guided responses” state.

## Streaming UX

Chat buffers tokens (~40ms) before React state updates, supports cancel, clears partial placeholders on error/crisis, and cancels generation when the app backgrounds or the screen unmounts.

Final assistant text is persisted only after generation completes (or crisis/safety replacement).

## Privacy

- No cloud LLM inference
- No API keys
- No conversation / journal upload
- Model weights are a separate download (Play on-demand, or the pinned file). Chat stays on device.
- `android.permission.INTERNET` remains blocked in `app.json`. Play delivers the on-demand pack. A build that removes that block can also fetch the pinned file.

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

EAS runs prebuild on the build servers, so the config plugin packs the GGUF into the on-demand asset pack inside the AAB. The base module the user installs first does not contain it.

### Local AAB testing with asset packs

Use [bundletool](https://github.com/google/bundletool) with `--local-testing` so the on-demand pack can be fetched on a sideloaded build. Otherwise use Settings → Download on-device model.

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
