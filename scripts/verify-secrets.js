#!/usr/bin/env node
/**
 * Fails if tracked files contain signing secrets or credential patterns.
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

const SECRET_PATTERNS = [
  { name: 'keystore file', regex: /\.keystore$/i },
  { name: 'jks file', regex: /\.jks$/i },
  { name: 'keystore-credentials file', regex: /keystore-credentials/i },
  { name: 'Gradle storePassword literal', regex: /storePassword\s*[=:]\s*['"][^'"]+['"]/i },
  { name: 'Gradle keyPassword literal', regex: /keyPassword\s*[=:]\s*['"][^'"]+['"]/i },
  { name: 'upload key password env sample', regex: /OPPUNA_UPLOAD_(STORE|KEY)_PASSWORD\s*=\s*\S+/i },
];

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
    execSync(`git ls-files --error-unmatch "${file}"`, { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const failures = [];
  const files = walk(ROOT).filter(isGitTracked);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const base = path.basename(file);

    for (const { name, regex } of SECRET_PATTERNS) {
      if (regex.test(base) || regex.test(rel)) {
        failures.push(`${rel}: matches ${name}`);
      }
    }

    if (/\.(ts|tsx|js|json|md|txt|yml|yaml|gradle|properties|env)$/i.test(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const { name, regex } of SECRET_PATTERNS) {
        if (regex.test(content)) {
          failures.push(`${rel}: content matches ${name}`);
        }
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
