#!/usr/bin/env node
/**
 * Validates Oppuna's offline-only configuration in app.json and source.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const SRC = path.join(ROOT, 'src');

const ALLOWED_NETWORK_FILES = new Set([
  path.normalize('src/services/networkGuard.ts'),
  path.normalize('src/screens/crisis/CrisisScreen.tsx'),
]);

const NETWORK_IMPORT_PATTERNS = [
  /\bfrom\s+['"]axios['"]/,
  /\brequire\(['"]axios['"]\)/,
  /\bfrom\s+['"]socket\.io/,
  /\bWebSocket\s*\(/,
];

function walkTs(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function main() {
  const failures = [];

  const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const blocked = app.expo?.android?.blockedPermissions ?? [];
  if (!blocked.includes('android.permission.INTERNET')) {
    failures.push('app.json: android.blockedPermissions must include android.permission.INTERNET');
  }

  const permissions = app.expo?.android?.permissions ?? [];
  if (permissions.includes('android.permission.INTERNET')) {
    failures.push('app.json: android.permissions must not include INTERNET');
  }

  if (app.expo?.extra?.offlineOnly !== true) {
    failures.push('app.json: extra.offlineOnly must be true');
  }

  for (const file of walkTs(SRC)) {
    const rel = path.normalize(path.relative(ROOT, file));
    if (ALLOWED_NETWORK_FILES.has(rel)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of NETWORK_IMPORT_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`${rel}: disallowed network dependency pattern ${pattern}`);
      }
    }
    if (/\bfetch\s*\(/.test(content) && !content.includes('networkGuard')) {
      failures.push(`${rel}: raw fetch() usage — route through offline guard or justify`);
    }
  }

  if (failures.length > 0) {
    console.error('Offline validation FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('Offline validation passed.');
}

main();
