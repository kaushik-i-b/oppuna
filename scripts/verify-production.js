#!/usr/bin/env node
/**
 * Runs all mandatory production validation gates.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const STEPS = [
  ['typecheck', 'npm run typecheck'],
  ['lint', 'npm run lint'],
  ['test', 'npm test -- --ci --passWithNoTests=false'],
  ['verify:secrets', 'node scripts/verify-secrets.js'],
  ['verify:offline', 'node scripts/verify-offline.js'],
  ['verify:privacy-config', 'node scripts/verify-privacy-config.js'],
  ['verify:model', 'OPPUNA_CI=1 node scripts/verify-model.js'],
  ['inspect:android-release', 'node scripts/inspect-android-release.js'],
];

function run(label, command) {
  process.stdout.write(`\n=== ${label} ===\n`);
  execSync(command, { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  for (const [label, command] of STEPS) {
    try {
      run(label, command);
    } catch {
      console.error(`\nProduction validation FAILED at: ${label}`);
      process.exit(1);
    }
  }
  console.log('\nAll production validation gates passed.');
}

main();
