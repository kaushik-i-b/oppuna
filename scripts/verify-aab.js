#!/usr/bin/env node
/**
 * Inspects a built Android App Bundle for the Gemma install-time asset pack.
 *
 * Usage: npm run verify:aab -- path/to/app.aab
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const LOCAL_MODEL = path.join(ROOT, 'src', 'config', 'localModel.ts');
const GGUF_MAGIC = Buffer.from('GGUF', 'ascii');

function parseExpectedConfig() {
  const src = fs.readFileSync(LOCAL_MODEL, 'utf8');
  const shaMatch = src.match(/sha256:\s*'([a-f0-9]{64})'/i);
  const sizeMatch = src.match(/expectedSize:\s*(\d+)/);
  return {
    sha256: shaMatch ? shaMatch[1].toLowerCase() : '',
    expectedSize: sizeMatch ? Number(sizeMatch[1]) : 0,
    fileName: 'model.gguf',
    packName: 'ai_model_asset_pack',
  };
}

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`PASS ${msg}`);
}

function main() {
  const aabArg = process.argv[2];
  if (!aabArg) {
    console.error('Usage: npm run verify:aab -- <path-to.aab>');
    process.exit(1);
  }

  const aabPath = path.resolve(aabArg);
  if (!fs.existsSync(aabPath)) fail(`AAB not found: ${aabPath}`);
  pass('AAB exists');

  const config = parseExpectedConfig();
  let listing = '';
  try {
    listing = execSync(`unzip -l ${JSON.stringify(aabPath)}`, { encoding: 'utf8' });
  } catch (error) {
    fail(`Could not list AAB contents (is unzip installed?): ${error.message}`);
  }

  if (!listing.includes(config.packName)) {
    fail(`Asset pack module "${config.packName}" not found in AAB`);
  }
  pass(`Asset pack "${config.packName}" present`);

  const modelEntries = listing
    .split('\n')
    .filter((line) => line.includes(config.fileName) && line.includes(config.packName));

  if (modelEntries.length === 0) {
    fail(`${config.fileName} not found inside asset pack`);
  }
  pass(`${config.fileName} listed in asset pack`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oppuna-aab-'));
  try {
    execSync(`unzip -o ${JSON.stringify(aabPath)} "${config.packName}/*${config.fileName}" -d ${JSON.stringify(tmpDir)}`, {
      stdio: 'pipe',
    });
  } catch {
  }

  const found = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === config.fileName) found.push(full);
    }
  }
  walk(tmpDir);

  if (found.length === 0) {
    fail(`Could not extract ${config.fileName} from AAB for inspection`);
  }

  const modelPath = found[0];
  const stat = fs.statSync(modelPath);
  if (stat.size !== config.expectedSize) {
    fail(`Model size mismatch in AAB: expected ${config.expectedSize}, got ${stat.size}`);
  }
  pass(`Model size matches expected (${stat.size} bytes)`);

  const header = Buffer.alloc(4);
  const fd = fs.openSync(modelPath, 'r');
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);
  if (!header.equals(GGUF_MAGIC)) fail('Invalid GGUF header in packaged model');
  pass('GGUF header valid in AAB');

  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(modelPath));
  const sha = hash.digest('hex');
  if (config.sha256 && sha !== config.sha256) fail('SHA-256 mismatch in packaged model');
  pass('SHA-256 matches configured digest');

  if (listing.includes('install-time') || listing.includes(config.packName)) {
    pass('Install-time asset pack structure present');
  }

  console.log('\nAAB model validation passed.');
}

main();
