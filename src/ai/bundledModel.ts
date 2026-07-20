/**
 * Bundled on-device model hook.
 *
 * Oppuna ships fully offline, so the mental-health LLM must live on the device.
 * A GGUF model can be large (hundreds of MB) and is therefore NOT committed to
 * the repository. To ship the on-device agent with the app, drop a GGUF file at
 * `assets/models/oppuna-model.gguf` and enable the require below.
 *
 * Kept as a standalone module so the rest of the AI layer never has to import a
 * (possibly missing) binary asset directly — Metro only bundles the asset when
 * this file references it. The default export is `null`, meaning "no bundled
 * model"; provisioning then no-ops and the app uses guided (rule-based)
 * responses until a model is present in local storage.
 *
 * Metro is configured to treat `.gguf` as an asset (see `metro.config.js`).
 */

/**
 * A React Native asset module reference (the value returned by `require(...)`),
 * or `null` when no model is bundled with this build.
 *
 * The concrete runtime type is a numeric module id, but we keep it opaque so
 * callers don't depend on Metro internals.
 */
export type BundledModelModule = number | null;

/**
 * The bundled GGUF model, or `null` when none ships with this build.
 *
 * To enable the on-device llama agent out of the box, add the model file and
 * replace the line below with:
 *
 * ```ts
 * export const BUNDLED_MODEL: BundledModelModule = require('../../assets/models/oppuna-model.gguf');
 * ```
 */
export const BUNDLED_MODEL: BundledModelModule = null;
