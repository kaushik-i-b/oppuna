#!/usr/bin/env node
/**
 * Fails if tracked files contain signing secrets or credential patterns.
 *
 * Path patterns apply to filenames/paths only.
 * Content patterns apply to file contents (not documentation prose about filenames).
 * The scanner source and its unit tests are excluded from content self-matching.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  'android',
  'ios',
  'coverage',
  'dist',
  'web-build',
]);

/** Forbidden filenames / path segments (never apply to file content). */
const FORBIDDEN_PATH_PATTERNS = [
  { name: 'keystore file', regex: /\.keystore$/i },
  { name: 'jks file', regex: /\.jks$/i },
  { name: 'keystore-credentials file', regex: /(^|\/)keystore-credentials(\.txt)?$/i },
  { name: 'signing credentials file', regex: /(^|\/)signing-credentials/i },
  { name: 'private key file', regex: /\.(pem|p12|pfx)$/i },
];

/** Sensitive content — env placeholders like ${KEYSTORE_PASSWORD} must PASS. */
const SENSITIVE_CONTENT_PATTERNS = [
  { name: 'Gradle storePassword literal', regex: /storePassword\s*[=:]\s*['"]([^'"]+)['"]/i, allow: isPlaceholderValue },
  { name: 'Gradle keyPassword literal', regex: /keyPassword\s*[=:]\s*['"]([^'"]+)['"]/i, allow: isPlaceholderValue },
  {
    name: 'hardcoded upload key password',
    regex: /OPPUNA_UPLOAD_(?:STORE|KEY)_PASSWORD\s*=\s*([^\s#]+)/i,
    allow: isPlaceholderValue,
  },
  { name: 'private key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function isPlaceholderValue(match) {
  const value = (match[1] || match[0] || '').trim();
  if (!value) return true;
  if (value.startsWith('${') && value.endsWith('}')) return true;
  if (value === 'null' || value === 'undefined') return true;
  if (/^process\.env\./i.test(value)) return true;
  if (value.includes('YOUR_') || value.includes('CHANGE_ME') || value.includes('<password>')) return true;
  return false;
}

const CONTENT_EXTENSIONS = /\.(ts|tsx|js|json|gradle|properties|env|yml|yaml|kt|java)$/i;

/** Files that define or unit-test the scanner — exclude from content self-match. */
function isScannerSelfFile(rel) {
  const normalized = rel.replace(/\\/g, '/');
  return (
    normalized === 'scripts/verify-secrets.js' ||
    normalized === 'scripts/__tests__/verify-secrets.test.js'
  );
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function isGitTracked(file) {
  try {
    execSync(`git ls-files --error-unmatch -- ${JSON.stringify(path.relative(ROOT, file))}`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const failures = [];
  const files = walk(ROOT).filter(isGitTracked);

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const base = path.basename(file);

    for (const { name, regex } of FORBIDDEN_PATH_PATTERNS) {
      if (regex.test(base) || regex.test(rel)) {
        failures.push(`${rel}: forbidden path pattern (${name})`);
      }
    }

    if (!CONTENT_EXTENSIONS.test(file)) continue;
    if (isScannerSelfFile(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    for (const { name, regex, allow } of SENSITIVE_CONTENT_PATTERNS) {
      const match = content.match(regex);
      if (match && !(allow && allow(match))) {
        failures.push(`${rel}: sensitive content (${name})`);
      }
    }
  }

  if (failures.length > 0) {
    console.error('Secret pattern check FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('Secret pattern check passed.');
}

main();
