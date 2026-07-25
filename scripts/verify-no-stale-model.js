#!/usr/bin/env node
/**
 * Fails when prohibited stale-model (Gemma) references appear in
 * production-critical paths. Archival docs may mention Gemma only when
 * clearly labeled as historical.
 *
 * Usage: npm run verify:no-stale-model
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** Paths that must never contain Gemma references (substring match on relative path). */
const PROHIBITED_GLOBS = [
  /^src\//,
  /^config\//,
  /^plugins\//,
  /^scripts\//,
  /^assets\/licenses\//,
  /^assets\/ai-model\//,
  /^app\.json$/,
  /^eas\.json$/,
  /^package\.json$/,
  /^\.github\//,
];

/** Relative paths allowed to mention Gemma only with historical/archival context. */
const ARCHIVAL_WHITELIST = new Set([
  'docs/QWEN_MODEL.md',
  'docs/QWEN_DISTRIBUTION.md',
  'docs/PRODUCTION_READINESS.md',
  'docs/PLAY_MODEL_VALIDATION.md',
  'docs/PLAY_STORE_RELEASE_CHECKLIST.md',
  'docs/LOCAL_LLM_ANDROID.md',
  'release/README.md',
  'assets/ai-model/README.md',
]);

/** Enforcement / tooling files that must mention Gemma to ban it. */
const ENFORCEMENT_WHITELIST = new Set([
  'scripts/verify-no-stale-model.js',
  'scripts/verify-aab.js',
  'scripts/verify-model.js',
  'scripts/__tests__/verify-no-stale-model.test.js',
]);

const PROHIBITED_PATTERNS = [
  new RegExp('\\bgemma\\b', 'i'),
  new RegExp('\\bgemma-?2\\b', 'i'),
  new RegExp('\\bgemma2\\b', 'i'),
  new RegExp('GEMMA[-_](NOTICE|LICENSE|TERMS)', 'i'),
  new RegExp('gemma[-_]?terms', 'i'),
  new RegExp('google/gemma', 'i'),
];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.txt',
  '.kt',
  '.java',
  '.xml',
  '.gradle',
  '.kts',
  '.yml',
  '.yaml',
  '.properties',
  '.sh',
]);

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'android',
  'ios',
  'release',
  'dist',
  'build',
  '.expo',
  'coverage',
]);

function pass(line) {
  console.log(`PASS ${line}`);
}

function fail(line) {
  console.error(`FAIL ${line}`);
}

function isProhibitedPath(rel) {
  return PROHIBITED_GLOBS.some((re) => re.test(rel));
}

function isArchivalWhitelisted(rel) {
  return ARCHIVAL_WHITELIST.has(rel);
}

function hasHistoricalLabel(text) {
  return (
    /historical|archiv|obsolete|removed|migrated from|pre-qwen|former(ly)?|do not use|stale/i.test(
      text,
    )
  );
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && entry.name !== 'Dockerfile') continue;
    out.push(full);
  }
  return out;
}

function scanFile(fullPath) {
  const rel = path.relative(ROOT, fullPath).split(path.sep).join('/');
  let text;
  try {
    text = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return [];
  }

  const hits = [];
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      hits.push(pattern.toString());
    }
  }
  if (hits.length === 0) return [];

  if (ENFORCEMENT_WHITELIST.has(rel)) {
    return [];
  }

  if (isArchivalWhitelisted(rel) && hasHistoricalLabel(text)) {
    return [];
  }

  // Always fail production-critical paths.
  if (isProhibitedPath(rel) || !isArchivalWhitelisted(rel)) {
    return hits.map((p) => `${rel} matches ${p}`);
  }

  return [`${rel} mentions Gemma without a clear historical/archival label`];
}

function main() {
  console.log('STALE MODEL REFERENCE CHECK\n');
  const failures = [];

  const roots = [
    path.join(ROOT, 'src'),
    path.join(ROOT, 'config'),
    path.join(ROOT, 'plugins'),
    path.join(ROOT, 'scripts'),
    path.join(ROOT, 'assets', 'licenses'),
    path.join(ROOT, 'assets', 'ai-model'),
    path.join(ROOT, 'docs'),
    path.join(ROOT, '.github'),
  ];
  const files = [
    path.join(ROOT, 'app.json'),
    path.join(ROOT, 'eas.json'),
    path.join(ROOT, 'package.json'),
    path.join(ROOT, 'release', 'README.md'),
  ];

  for (const root of roots) {
    walk(root, files);
  }

  const unique = [...new Set(files)].filter((f) => fs.existsSync(f));
  for (const file of unique) {
    failures.push(...scanFile(file));
  }

  // Explicit license filename bans under assets/licenses
  const licenseDir = path.join(ROOT, 'assets', 'licenses');
  if (fs.existsSync(licenseDir)) {
    for (const name of fs.readdirSync(licenseDir)) {
      if (/gemma/i.test(name)) {
        failures.push(`assets/licenses/${name} is a prohibited Gemma license asset`);
      }
    }
  }

  if (failures.length > 0) {
    for (const f of failures) fail(f);
    console.error(`\nFound ${failures.length} prohibited stale-model reference(s).`);
    process.exit(1);
  }

  pass('no prohibited Gemma references in production-critical paths');
  console.log('\nStale model reference check passed.');
}

main();
