# On-device mental-health model (GGUF)

Oppuna's chat companion can run a small large-language model **entirely on the
device** via [`llama.rn`](https://github.com/mybigday/llama.rn). No network is
ever used — the model is bundled into the app and staged into private local
storage on first launch.

## Enable the bundled agent

1. Download a small, quantized instruction-tuned GGUF model. A Llama 3.2 1B
   Instruct build quantized to `Q4_K_M` (~0.8 GB) is a good balance of quality
   and size for phones. Larger models improve quality but increase app size,
   memory use, and latency.
2. Save it in this folder as:

   ```
   assets/models/oppuna-model.gguf
   ```

3. Turn on the bundled model by editing `src/ai/bundledModel.ts`:

   ```ts
   export const BUNDLED_MODEL: BundledModelModule = require('../../assets/models/oppuna-model.gguf');
   ```

4. Rebuild the app (`expo run:android` / `expo run:ios` or an EAS build).

On first launch `src/ai/modelProvisioning.ts` copies the bundled file into
`{documentDirectory}models/oppuna-model.gguf`, the model manager discovers it,
and the chat screen loads the on-device agent. If no model is present the app
falls back to the deterministic guided (rule-based) responses.

## Alternative: side-load without bundling

You can also push a GGUF straight into the app's models directory (path is
logged at startup and returned by `getModelsDirectory()`), e.g. during
development, without shipping it in the bundle.

> The `.gguf` file is intentionally **not** committed to git — these models are
> hundreds of megabytes. This folder only carries these instructions.
