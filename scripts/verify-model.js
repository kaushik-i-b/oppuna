#!/usr/bin/env node
/**
 * Validates the real Gemma GGUF file and production model configuration.
 *
 * CI mode (OPPUNA_CI=1): skips binary checks when model.gguf is absent.
 * Production mode (OPPUNA_PRODUCTION_VALIDATE=1): requires the real model file.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODEL_PATH = path.join(ROOT, 'assets', 'ai-model', 'model.gguf');
const APP_JSON = path.join(ROOT, 'app.json');
const LOCAL_MODEL = path.join(ROOT, 'src', 'config', 'localModel.ts');
const ASSET_PACK_PLUGIN = path.join(ROOT, 'plugins', 'withAiModelAssetPack.js');
const LICENSES = path.join(ROOT, 'assets', 'licenses');
const GGUF_MAGIC = Buffer.from('GGUF', 'ascii');

const CI_MODE = process.env.OPPUNA_CI === '1' || process.argv.includes('--ci');
const PRODUCTION_MODE =
  process.env.OPPUNA_PRODUCTION_VALIDATE === '1' || process.argv.includes('--production');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseExpectedConfig() {
  const src = read(LOCAL_MODEL);
  const shaMatch = src.match(/sha256:\s*'([a-f0-9]{64})'/i);
  const sizeMatch = src.match(/expectedSize:\s*(\d+)/);
  const idMatch = src.match(/id:\s*'([^']+)'/);
  return {
    sha256: shaMatch ? shaMatch[1].toLowerCase() : '',
    expectedSize: sizeMatch ? Number(sizeMatch[1]) : 0,
    id: idMatch ? idMatch[1] : '',
  };
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function checkGgufHeader(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    return buf.equals(GGUF_MAGIC);
  } finally {
    fs.closeSync(fd);
  }
}

function pass(line) {
  console.log(`PASS ${line}`);
}

function fail(line) {
  console.error(`FAIL ${line}`);
}

async function main() {
  const failures = [];
  const config = parseExpectedConfig();

  console.log('MODEL VALIDATION\n');

  const app = JSON.parse(read(APP_JSON));
  const llm = app.expo?.extra?.localLlm;
  if (!llm?.modelId) failures.push('app.json: extra.localLlm.modelId is required');
  if (!llm?.assetPack) failures.push('app.json: extra.localLlm.assetPack is required');
  if (llm?.provider !== 'llama.rn') failures.push('app.json: localLlm.provider must be llama.rn');
  if (llm?.modelId !== config.id) failures.push('app.json modelId does not match localModel.ts');

  const pluginSrc = read(ASSET_PACK_PLUGIN);
  if (!pluginSrc.includes('install-time')) {
    failures.push('withAiModelAssetPack.js must use install-time delivery');
  } else {
    pass('install-time asset-pack configured');
  }

  const requiredLicenses = [
    'GEMMA-NOTICE.txt',
    'GEMMA-TERMS-OF-USE.txt',
    'llama-rn-MIT.txt',
    'llama-cpp-MIT.txt',
  ];
  for (const file of requiredLicenses) {
    const full = path.join(LICENSES, file);
    if (!fs.existsSync(full)) {
      failures.push(`assets/licenses/${file} is missing`);
    } else if (file === 'GEMMA-TERMS-OF-USE.txt') {
      const text = read(full);
      if (text.includes('BLOCKING TODO') || text.includes('PLACEHOLDER')) {
        if (PRODUCTION_MODE) {
          failures.push('GEMMA-TERMS-OF-USE.txt is not authoritative — replace before production');
        } else if (CI_MODE) {
          console.log('SKIPPED — authoritative Gemma terms unavailable in CI');
        } else {
          failures.push('GEMMA-TERMS-OF-USE.txt is not authoritative — replace before production');
        }
      }
    }
  }

  const modelExists = fs.existsSync(MODEL_PATH);
  if (!modelExists) {
    if (PRODUCTION_MODE) {
      failures.push(`Missing required model file: ${MODEL_PATH}`);
      fail('model.gguf exists');
    } else if (CI_MODE) {
      console.log('SKIPPED — model binary unavailable in CI (source/config checks only)');
    } else {
      failures.push(`Missing model file: ${MODEL_PATH} (set OPPUNA_CI=1 to skip in CI)`);
      fail('model.gguf exists');
    }
  } else {
    pass('model.gguf exists');

    const stat = fs.statSync(MODEL_PATH);
    if (stat.size !== config.expectedSize) {
      failures.push(`Size mismatch: expected ${config.expectedSize}, got ${stat.size}`);
      fail(`actual size = expected size (${stat.size} vs ${config.expectedSize})`);
    } else {
      pass(`actual size = expected size (${stat.size})`);
    }

    if (!checkGgufHeader(MODEL_PATH)) {
      failures.push('Invalid GGUF header magic');
      fail('GGUF header valid');
    } else {
      pass('GGUF header valid');
    }

    const actualSha = await sha256File(MODEL_PATH);
    if (config.sha256 && actualSha !== config.sha256) {
      failures.push(`SHA-256 mismatch`);
      fail('SHA-256 verified');
    } else {
      pass('SHA-256 verified');
    }
  }

  if (failures.length > 0) {
    console.error('\nModel configuration validation FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nModel configuration validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
