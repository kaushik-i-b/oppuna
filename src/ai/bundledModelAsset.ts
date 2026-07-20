/**
 * Optional release-build hook for a bundled on-device Llama GGUF model.
 *
 * Keep the default as `null` so development builds and this repository do not
 * require committing large model weights. To ship a bundled model, add the GGUF
 * file to `assets/models/`, then return its static asset module here:
 *
 *   return require('../../assets/models/oppuna-model.gguf');
 */
export function getBundledModelAssetModule(): number | null {
  return null;
}
