#!/usr/bin/env node
/**
 * Validates on-device GGUF + model configuration.
 *
 * Modes:
 *   --ci / OPPUNA_CI=1          : may SKIP unavailable model binary
 *   --production / OPPUNA_PRODUCTION_VALIDATE=1 : STRICT — never skip
 *   default                     : STRICT (same as production)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { loadLocalModelConfig } = require('./lib/localModelConfig');

const ROOT = path.join(__dirname, '..');
const MODEL_PATH = path.join(ROOT, 'assets', 'ai-model', 'model.gguf');
const APP_JSON = path.join(ROOT, 'app.json');
const ASSET_PACK_PLUGIN = path.join(ROOT, 'plugins', 'withAiModelAssetPack.js');
const LICENSES = path.join(ROOT, 'assets', 'licenses');
const GGUF_MAGIC = Buffer.from('GGUF', 'ascii');

/** Google Play install-time asset pack hard limit (1 GiB). */
const PLAY_INSTALL_TIME_PACK_MAX_BYTES = 1073741824;

const CI_MODE = process.env.OPPUNA_CI === '1' || process.argv.includes('--ci');
const PRODUCTION_MODE =
  process.env.OPPUNA_PRODUCTION_VALIDATE === '1' ||
  process.argv.includes('--production') ||
  !CI_MODE;

function read(file) {
  return fs.readFileSync(file, 'utf8');
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

function skipped(line) {
  console.log(`SKIPPED ${line}`);
}

function isPlaceholderLicense(text) {
  return (
    /BLOCKING TODO/i.test(text) ||
    /PLACEHOLDER/i.test(text) ||
    text.trim().length < 200 ||
    /replace this file entirely/i.test(text)
  );
}

async function main() {
  const failures = [];
  const config = loadLocalModelConfig();

  console.log('MODEL VALIDATION\n');
  console.log(`Mode: ${CI_MODE ? 'CI (skips allowed)' : 'STRICT'}`);
  console.log(`Expected size: ${config.expectedSize}`);
  console.log(`Model ID: ${config.modelId}\n`);

  if (config.expectedSize < config.minPlausibleSizeBytes) {
    failures.push(
      `expectedSize ${config.expectedSize} is below minPlausibleSizeBytes ${config.minPlausibleSizeBytes}`,
    );
    fail('expectedSize plausible');
  } else {
    pass(`shared config expectedSize = ${config.expectedSize}`);
  }

  if (config.expectedSize >= PLAY_INSTALL_TIME_PACK_MAX_BYTES) {
    failures.push(
      `expectedSize ${config.expectedSize} exceeds Play install-time pack limit ${PLAY_INSTALL_TIME_PACK_MAX_BYTES}`,
    );
    fail('Play install-time pack size limit');
  } else {
    pass(
      `expectedSize under Play install-time pack limit (${config.expectedSize} < ${PLAY_INSTALL_TIME_PACK_MAX_BYTES})`,
    );
  }

  const app = JSON.parse(read(APP_JSON));
  const llm = app.expo?.extra?.localLlm;
  if (!llm?.modelId) failures.push('app.json: extra.localLlm.modelId is required');
  if (!llm?.assetPack) failures.push('app.json: extra.localLlm.assetPack is required');
  if (llm?.provider !== 'llama.rn') failures.push('app.json: localLlm.provider must be llama.rn');
  if (llm?.modelId !== config.modelId) {
    failures.push('app.json modelId does not match config/local-model.json');
  }
  if (llm?.assetPack !== config.assetPackName) {
    failures.push('app.json assetPack does not match config/local-model.json');
  }

  const pluginSrc = read(ASSET_PACK_PLUGIN);
  if (!pluginSrc.includes('install-time') && !pluginSrc.includes(`"${config.deliveryType}"`)) {
    failures.push('withAiModelAssetPack.js must use install-time delivery');
    fail('install-time asset-pack configured');
  } else {
    pass('install-time asset-pack configured');
  }

  const requiredLicenses = [
    'QWEN-NOTICE.txt',
    'QWEN-LICENSE.txt',
    'llama-rn-MIT.txt',
    'llama-cpp-MIT.txt',
  ];
  const REQUIRED_NOTICE =
    'Qwen is provided under and subject to the Apache License, Version 2.0';
  for (const file of requiredLicenses) {
    const full = path.join(LICENSES, file);
    if (!fs.existsSync(full)) {
      failures.push(`assets/licenses/${file} is missing`);
      fail(`${file} exists`);
      continue;
    }
    pass(`${file} exists`);
    if (file === 'QWEN-NOTICE.txt') {
      const text = read(full);
      if (!text.includes(REQUIRED_NOTICE)) {
        failures.push('QWEN-NOTICE.txt missing required Qwen Notice sentence');
        fail('required Qwen Notice sentence');
      } else {
        pass('required Qwen Notice sentence present');
      }
    }
    if (file === 'QWEN-LICENSE.txt') {
      const text = read(full);
      if (isPlaceholderLicense(text) || !/Apache License/i.test(text)) {
        failures.push('QWEN-LICENSE.txt must contain the Apache License, Version 2.0 text');
        fail('authoritative Qwen / Apache-2.0 license');
      } else {
        pass('authoritative Qwen / Apache-2.0 license');
      }
    }
  }

  const modelExists = fs.existsSync(MODEL_PATH);
  if (!modelExists) {
    if (CI_MODE && !PRODUCTION_MODE) {
      skipped('model binary unavailable in CI (source/config checks only)');
    } else {
      failures.push(`Missing required model file: ${MODEL_PATH}`);
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

    if (stat.size >= PLAY_INSTALL_TIME_PACK_MAX_BYTES) {
      failures.push(
        `model.gguf size ${stat.size} exceeds Play install-time pack limit ${PLAY_INSTALL_TIME_PACK_MAX_BYTES}`,
      );
      fail('model.gguf under Play pack limit');
    } else {
      pass('model.gguf under Play pack limit');
    }

    if (!checkGgufHeader(MODEL_PATH)) {
      failures.push('Invalid GGUF header magic');
      fail('GGUF header valid');
    } else {
      pass('GGUF header valid');
    }

    const actualSha = await sha256File(MODEL_PATH);
    if (actualSha !== config.sha256) {
      failures.push('SHA-256 mismatch');
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
