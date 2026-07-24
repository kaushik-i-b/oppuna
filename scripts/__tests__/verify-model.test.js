/** @jest-environment node */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const VERIFY_MODEL = path.join(ROOT, 'scripts', 'verify-model.js');

function run(env = {}, args = '') {
  try {
    const out = execSync(`node ${JSON.stringify(VERIFY_MODEL)} ${args}`, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (error) {
    return {
      code: error.status ?? 1,
      out: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    };
  }
}

describe('verify-model modes', () => {
  it('CI mode may SKIP unavailable model binary', () => {
    const modelPath = path.join(ROOT, 'assets', 'ai-model', 'model.gguf');
    if (fs.existsSync(modelPath)) {
      // Real model present — SKIPPED path not exercised; still must pass.
      const result = run({ OPPUNA_CI: '1' }, '--ci');
      expect(result.code).toBe(0);
      return;
    }
    const result = run({ OPPUNA_CI: '1' }, '--ci');
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/SKIPPED.*model binary/i);
    expect(result.out).toMatch(/806058496/);
  });

  it('production mode does NOT skip missing model', () => {
    const modelPath = path.join(ROOT, 'assets', 'ai-model', 'model.gguf');
    if (fs.existsSync(modelPath)) {
      // Cannot assert FAIL for missing model when present.
      return;
    }
    const result = run({ OPPUNA_PRODUCTION_VALIDATE: '1' }, '--production');
    expect(result.code).not.toBe(0);
    expect(result.out).toMatch(/FAIL|missing|not authoritative/i);
  });

  it('production mode fails on placeholder Gemma terms', () => {
    const terms = path.join(ROOT, 'assets', 'licenses', 'GEMMA-TERMS-OF-USE.txt');
    const text = fs.readFileSync(terms, 'utf8');
    if (!/BLOCKING TODO|PLACEHOLDER/i.test(text)) {
      // Authoritative terms already present.
      return;
    }
    const result = run({ OPPUNA_PRODUCTION_VALIDATE: '1' }, '--production');
    expect(result.code).not.toBe(0);
    expect(result.out).toMatch(/authoritative Gemma Terms|not authoritative/i);
  });
});

describe('verify-aab missing artifact', () => {
  it('fails when AAB path does not exist', () => {
    const script = path.join(ROOT, 'scripts', 'verify-aab.js');
    try {
      execSync(`node ${JSON.stringify(script)} ${JSON.stringify(path.join(os.tmpdir(), 'missing.aab'))}`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      throw new Error('expected failure');
    } catch (error) {
      if (error.message === 'expected failure') throw error;
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      expect(out).toMatch(/FAIL.*AAB not found/i);
    }
  });
});

describe('native module policy', () => {
  it('does not use non-atomic copyTo fallback for final model file', () => {
    const kotlin = fs.readFileSync(
      path.join(ROOT, 'plugins', 'native', 'OppunaModelAssetModule.kt'),
      'utf8',
    );
    expect(kotlin).toMatch(/ATOMIC_MOVE/);
    expect(kotlin).not.toMatch(/tempFile\.copyTo\(modelFile/);
    expect(kotlin).toMatch(/requiredPrivateStorageBytes/);
    expect(kotlin).not.toMatch(/expectedSize \* 2/);
  });
});
