import { isValidGgufHeader, GGUF_MAGIC } from '@/utils/gguf';

describe('gguf header validation', () => {
  it('accepts valid GGUF magic', () => {
    const bytes = new Uint8Array([0x47, 0x47, 0x55, 0x46]);
    expect(isValidGgufHeader(bytes)).toBe(true);
    expect(GGUF_MAGIC).toBe(0x46554747);
  });

  it('rejects invalid magic', () => {
    expect(isValidGgufHeader(new Uint8Array([1, 2, 3, 4]))).toBe(false);
    expect(isValidGgufHeader(new Uint8Array([0x47]))).toBe(false);
  });
});
