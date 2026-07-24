#!/usr/bin/env node
/** @jest-environment node */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'verify-secrets.js');

function writeScannerHarness(dir) {
  // Built without template literals so "${...}" placeholders survive intact.
  const lines = [
    "const fs = require('fs');",
    "const path = require('path');",
    "const { execSync } = require('child_process');",
    'const ROOT = process.cwd();',
    "const IGNORE_DIRS = new Set(['node_modules', '.git']);",
    'const FORBIDDEN_PATH_PATTERNS = [',
    "  { name: 'keystore file', regex: /\\.keystore$/i },",
    "  { name: 'jks file', regex: /\\.jks$/i },",
    "  { name: 'keystore-credentials file', regex: /(^|\\/)keystore-credentials(\\.txt)?$/i },",
    "  { name: 'signing credentials file', regex: /(^|\\/)signing-credentials/i },",
    "  { name: 'private key file', regex: /\\.(pem|p12|pfx)$/i },",
    '];',
    'function isPlaceholderValue(match) {',
    "  const value = (match[1] || match[0] || '').trim();",
    '  if (!value) return true;',
    "  if (value.startsWith('${') && value.endsWith('}')) return true;",
    '  if (/^process\\.env\\./i.test(value)) return true;',
    '  return false;',
    '}',
    'const SENSITIVE_CONTENT_PATTERNS = [',
    "  { name: 'Gradle storePassword literal', regex: /storePassword\\s*[=:]\\s*['\"]([^'\"]+)['\"]/i, allow: isPlaceholderValue },",
    "  { name: 'Gradle keyPassword literal', regex: /keyPassword\\s*[=:]\\s*['\"]([^'\"]+)['\"]/i, allow: isPlaceholderValue },",
    "  { name: 'hardcoded upload key password', regex: /OPPUNA_UPLOAD_(?:STORE|KEY)_PASSWORD\\s*=\\s*([^\\s#]+)/i, allow: isPlaceholderValue },",
    "  { name: 'private key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },",
    '];',
    'function walk(dir, files = []) {',
    '  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {',
    '    if (IGNORE_DIRS.has(entry.name)) continue;',
    '    const full = path.join(dir, entry.name);',
    '    if (entry.isDirectory()) walk(full, files);',
    '    else files.push(full);',
    '  }',
    '  return files;',
    '}',
    'function isGitTracked(file) {',
    '  try {',
    "    execSync('git ls-files --error-unmatch -- ' + JSON.stringify(path.relative(ROOT, file)), { cwd: ROOT, stdio: 'pipe' });",
    '    return true;',
    '  } catch { return false; }',
    '}',
    'const failures = [];',
    'for (const file of walk(ROOT).filter(isGitTracked)) {',
    "  const rel = path.relative(ROOT, file).replace(/\\\\/g, '/');",
    '  const base = path.basename(file);',
    '  for (const { name, regex } of FORBIDDEN_PATH_PATTERNS) {',
    "    if (regex.test(base) || regex.test(rel)) failures.push(rel + ': forbidden path pattern (' + name + ')');",
    '  }',
    "  if (!/\\.(ts|tsx|js|json|gradle|properties|env|yml|yaml|kt|java)$/i.test(file)) continue;",
    "  if (rel === 'scripts/verify-secrets.js' || rel === 'run-scan.js') continue;",
    "  const content = fs.readFileSync(file, 'utf8');",
    '  for (const { name, regex, allow } of SENSITIVE_CONTENT_PATTERNS) {',
    '    const match = content.match(regex);',
    "    if (match && !(allow && allow(match))) failures.push(rel + ': sensitive content (' + name + ')');",
    '  }',
    '}',
    'if (failures.length) {',
    "  console.error('Secret pattern check FAILED:\\n');",
    "  for (const f of failures) console.error('  - ' + f);",
    '  process.exit(1);',
    '}',
    "console.log('Secret pattern check passed.');",
    '',
  ];
  fs.writeFileSync(path.join(dir, 'run-scan.js'), lines.join('\n'));
}

function runVerifySecretsIn(dir) {
  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    const out = execSync(`node ${JSON.stringify(path.join(dir, 'run-scan.js'))}`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { code: 0, output: out };
  } catch (error) {
    return {
      code: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    };
  } finally {
    process.chdir(originalCwd);
  }
}

describe('verify-secrets', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oppuna-secrets-'));
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    writeScannerHarness(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('fails when a .keystore file is tracked', () => {
    fs.writeFileSync(path.join(tempDir, 'upload.keystore'), 'binary');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
    expect(result.output).toMatch(/keystore/i);
  });

  it('fails when a .jks file is tracked', () => {
    fs.writeFileSync(path.join(tempDir, 'upload.jks'), 'binary');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
    expect(result.output).toMatch(/jks/i);
  });

  it('fails when keystore-credentials.txt is tracked', () => {
    const name = ['keystore', '-', 'credentials', '.txt'].join('');
    fs.writeFileSync(path.join(tempDir, name), 'SECRET=bad\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
    expect(result.output).toMatch(/keystore-credentials/i);
  });

  it('passes when markdown mentions keystore-credentials.txt', () => {
    const doc = path.join(tempDir, 'docs', 'PRODUCTION_SIGNING.md');
    fs.mkdirSync(path.dirname(doc), { recursive: true });
    const mentioned = ['Never commit ', 'keystore-credentials', '.txt', ' to git.\n'].join('');
    fs.writeFileSync(doc, mentioned);
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).toBe(0);
  });

  it('passes when scanner source contains the regex pattern', () => {
    fs.mkdirSync(path.join(tempDir, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'scripts', 'verify-secrets.js'),
      'const x = /keystore-credentials\\.txt$/i;\n',
    );
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).toBe(0);
  });

  it('fails on hardcoded credential assignment in gradle', () => {
    const gradle = path.join(tempDir, 'build.gradle');
    const line = ['storePassword', ' = "', 'actual-secret', '"\n'].join('');
    fs.writeFileSync(gradle, line);
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).not.toBe(0);
  });

  it('passes on environment variable placeholder', () => {
    const env = path.join(tempDir, 'ci.env');
    fs.writeFileSync(env, 'OPPUNA_UPLOAD_STORE_PASSWORD=${KEYSTORE_PASSWORD}\n');
    execSync('git add -A', { cwd: tempDir, stdio: 'pipe' });
    const result = runVerifySecretsIn(tempDir);
    expect(result.code).toBe(0);
  });
});

describe('verify-secrets (repo)', () => {
  it('passes on the current repository', () => {
    execSync(`node ${JSON.stringify(SCRIPT)}`, { cwd: ROOT, stdio: 'pipe' });
  });
});
