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

  it('never includes multiline stack traces in error summary', () => {
    const status = getModelDiagnosticStatus();
    expect(status.errorSummary ?? '').not.toMatch(/\n\s+at /);
  });
});
