#!/usr/bin/env node
/**
 * STRICT production validation.
 * Never skips model binary, SHA, size, GGUF, or legal file checks.
 * Do NOT set OPPUNA_CI=1 here.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const STEPS = [
  ['typecheck', 'npm run typecheck', {}],
  ['lint', 'npm run lint', {}],
  ['test', 'npm test -- --ci --watchman=false --passWithNoTests=false', {}],
  ['verify:secrets', 'node scripts/verify-secrets.js', {}],
  ['verify:offline', 'node scripts/verify-offline.js', {}],
  ['verify:privacy-config', 'node scripts/verify-privacy-config.js', {}],
  ['verify:no-stale-model', 'node scripts/verify-no-stale-model.js', {}],
  [
    'verify:model (STRICT)',
    'node scripts/verify-model.js --production',
    { OPPUNA_PRODUCTION_VALIDATE: '1', OPPUNA_CI: '' },
  ],
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
  console.log('Production validation (STRICT — no skips)\n');
  for (const [label, command, extraEnv] of STEPS) {
    try {
      run(label, command, extraEnv);
    } catch {
      console.error(`\nProduction validation FAILED at: ${label}`);
      process.exit(1);
    }
  }
  console.log('\nAll production validation gates passed.');
}

main();
