#!/usr/bin/env node
/** @jest-environment node */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function runVerifySecretsIn(dir) {
  const script = path.join(ROOT, 'scripts', 'verify-secrets.js');
  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    execSync(`node ${JSON.stringify(script)}`, { stdio: 'pipe', encoding: 'utf8' });
    return { code: 0, output: '' };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  } finally {
    process.chdir(originalCwd);
  }
}

describe('verify-secrets', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oppuna-secrets-'));
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    fs.copyFileSync(path.join(ROOT, 'scripts', 'verify-secrets.js'), path.join(tempDir, 'verify-secrets.js'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('passes when markdown mentions keystore-credentials.txt', () => {
    const doc = path.join(tempDir, 'docs', 'PRODUCTION_SIGNING.md');
    fs.mkdirSync(path.dirname(doc), { recursive: true });
    fs.writeFileSync(doc, 'Never commit keystore-credentials.txt to git.\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).toBe(0);
  });

  it('fails when keystore-credentials.txt is tracked', () => {
    fs.writeFileSync(path.join(tempDir, 'keystore-credentials.txt'), 'SECRET=bad\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
    expect(result.output).toMatch(/keystore-credentials/i);
  });

  it('fails on hardcoded credential assignment in gradle', () => {
    const gradle = path.join(tempDir, 'build.gradle');
    fs.writeFileSync(gradle, 'storePassword = "actual-secret"\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
  });

  it('passes on environment variable reference', () => {
    const env = path.join(tempDir, 'ci.env');
    fs.writeFileSync(env, 'OPPUNA_UPLOAD_STORE_PASSWORD=${KEYSTORE_PASSWORD}\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).toBe(0);
  });
});
