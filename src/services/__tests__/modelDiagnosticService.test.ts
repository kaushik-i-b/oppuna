import { __resetModelManagerForTests } from '@/ai/modelManager';
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';

describe('modelDiagnosticService', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
  });

  it('reports initializing or guided offline before model is ready', () => {
    const status = getModelDiagnosticStatus();
    expect(['initializing', 'guided-offline']).toContain(status.engineMode);
    expect(status.subtitle).toMatch(/Offline|offline/i);
  });

  it('exposes exact Qwen identity fields without inventing PASS', () => {
    const status = getModelDiagnosticStatus();
    expect(status.exactModel).toMatch(/Qwen2\.5/i);
    expect(status.family.toLowerCase()).toContain('qwen');
    expect(status.quantization).toBe('Q4_K_M');
    expect(status.sha256Prefix).toMatch(/^[a-f0-9]{12}…$/);
    expect(status.lastResponseSource === null || typeof status.lastResponseSource === 'string').toBe(
      true,
    );
  });

  it('never includes multiline stack traces in error summary', () => {
    const status = getModelDiagnosticStatus();
    expect(status.errorSummary ?? '').not.toMatch(/\n\s+at /);
  });
});
