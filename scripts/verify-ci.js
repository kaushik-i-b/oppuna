#!/usr/bin/env node
/**
 * CI / PR source validation.
 * May SKIP large unavailable artifacts (model binary).
 * Never calls SKIPPED a PASS.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const STEPS = [
  ['typecheck', 'npm run typecheck', {}],
  ['lint', 'npm run lint', {}],
  ['test', 'npm test -- --ci --passWithNoTests=false', {}],
  ['verify:secrets', 'node scripts/verify-secrets.js', {}],
  ['verify:offline', 'node scripts/verify-offline.js', {}],
  ['verify:privacy-config', 'node scripts/verify-privacy-config.js', {}],
  ['verify:model (CI)', 'node scripts/verify-model.js --ci', { OPPUNA_CI: '1' }],
  ['inspect:android-release', 'node scripts/inspect-android-release.js', {}],
];

function run(label, command, extraEnv) {
  process.stdout.write(`\n=== ${label} ===\n`);
  execSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: true,
  });
}

function main() {
  console.log('CI validation (skips allowed for unavailable release artifacts)\n');
  for (const [label, command, extraEnv] of STEPS) {
    try {
      run(label, command, extraEnv);
    } catch {
      console.error(`\nCI validation FAILED at: ${label}`);
      process.exit(1);
    }
  }
  console.log('\nCI validation passed (SKIPPED items are not PASS).');
}

main();
