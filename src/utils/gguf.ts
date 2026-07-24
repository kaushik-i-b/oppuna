/** GGUF container magic bytes: "GGUF" */
export const GGUF_MAGIC = 0x46554747;

/** Validates the first 4 bytes of a file buffer are GGUF magic (little-endian). */
export function isValidGgufHeader(buffer: ArrayBuffer | Uint8Array): boolean {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (view.byteLength < 4) return false;
  const magic =
    view[0]! | (view[1]! << 8) | (view[2]! << 16) | (view[3]! << 24);
  return magic === GGUF_MAGIC;
}
