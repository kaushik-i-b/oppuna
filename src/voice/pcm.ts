const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function floatTo16BitPCM(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i] ?? 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm;
}

export function downsampleBuffer(
  input: Float32Array,
  inputRate: number,
  outputRate: number,
): Float32Array {
  if (outputRate >= inputRate) return input;
  const ratio = inputRate / outputRate;
  const length = Math.floor(input.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j] ?? 0;
      count += 1;
    }
    output[i] = count === 0 ? 0 : sum / count;
  }
  return output;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const c = i + 2 < bytes.length ? (bytes[i + 2] ?? 0) : 0;
    const triple = (a << 16) | (b << 8) | c;
    output += B64[(triple >> 18) & 63];
    output += B64[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? B64[(triple >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? B64[triple & 63] : '=';
  }
  return output;
}

export function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/=+$/, '').replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i] ?? 'A');
    const b = B64.indexOf(clean[i + 1] ?? 'A');
    const cChar = clean[i + 2];
    const dChar = clean[i + 3];
    const c = cChar !== undefined ? B64.indexOf(cChar) : -1;
    const d = dChar !== undefined ? B64.indexOf(dChar) : -1;
    bytes.push(((a << 2) | (b >> 4)) & 255);
    if (c >= 0) bytes.push((((b & 15) << 4) | (c >> 2)) & 255);
    if (d >= 0 && c >= 0) bytes.push((((c & 3) << 6) | d) & 255);
  }
  return Uint8Array.from(bytes);
}

export function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  return bytesToBase64(bytes);
}

export const VOICE_SAMPLE_RATE = 24000;
