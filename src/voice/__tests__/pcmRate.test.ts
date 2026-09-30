import { createStreamingRateConverter, floatTo16BitPCM, pcm16BytesToFloat } from '@/voice/pcm';

describe('streaming rate conversion', () => {
  it('averages a 48 kHz signal down to 24 kHz without dropping the boundary between chunks', () => {
    const whole = createStreamingRateConverter(48000, 24000);
    const split = createStreamingRateConverter(48000, 24000);
    const input = new Float32Array(8);
    input.set([0.2, 0.2, 0.6, 0.6, -0.4, -0.4, 0.8, 0.8]);
    const once = whole.process(input);
    const left = split.process(input.subarray(0, 3));
    const right = split.process(input.subarray(3));
    const joined = new Float32Array(left.length + right.length);
    joined.set(left, 0);
    joined.set(right, left.length);
    expect(Array.from(once).map((sample) => Math.round(sample * 10) / 10)).toEqual([0.2, 0.6, -0.4, 0.8]);
    expect(Array.from(joined)).toEqual(Array.from(once));
  });

  it('upsamples a constant signal to the output rate and stays continuous across chunks', () => {
    const once = createStreamingRateConverter(24000, 48000);
    const split = createStreamingRateConverter(24000, 48000);
    const input = new Float32Array(32).fill(0.25);
    const whole = once.process(input);
    const left = split.process(input.subarray(0, 10));
    const right = split.process(input.subarray(10));
    const joined = new Float32Array(left.length + right.length);
    joined.set(left, 0);
    joined.set(right, left.length);
    expect(whole.length).toBeGreaterThan(50);
    for (const sample of whole) expect(Math.abs(sample - 0.25)).toBeLessThan(1e-6);
    const count = Math.min(whole.length, joined.length);
    for (let i = 0; i < count; i += 1) {
      expect(Math.abs((whole[i] ?? 0) - (joined[i] ?? 0))).toBeLessThan(1e-6);
    }
  });

  it('round-trips PCM16 little-endian values', () => {
    const pcm = floatTo16BitPCM(Float32Array.from([0, 0.5, -0.5, -1]));
    const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    const floats = pcm16BytesToFloat(bytes);
    expect(floats[0]).toBe(0);
    expect(floats[1]).toBeCloseTo(0.5, 2);
    expect(floats[2]).toBeCloseTo(-0.5, 2);
    expect(floats[3]).toBeCloseTo(-1, 2);
  });
});
