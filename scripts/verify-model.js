#!/usr/bin/env node
/**
 * Validates on-device model configuration consistency.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const LOCAL_MODEL = path.join(ROOT, 'src', 'config', 'localModel.ts');
const ASSET_PACK_PLUGIN = path.join(ROOT, 'plugins', 'withAiModelAssetPack.js');
const LICENSES = path.join(ROOT, 'assets', 'licenses');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function main() {
  const failures = [];

  const app = JSON.parse(read(APP_JSON));
  const llm = app.expo?.extra?.localLlm;
  if (!llm?.modelId) failures.push('app.json: extra.localLlm.modelId is required');
  if (!llm?.assetPack) failures.push('app.json: extra.localLlm.assetPack is required');
  if (!llm?.modelFile) failures.push('app.json: extra.localLlm.modelFile is required');
  if (llm?.provider !== 'llama.rn') failures.push('app.json: localLlm.provider must be llama.rn');

  const modelSrc = read(LOCAL_MODEL);
  if (!modelSrc.includes("id: 'oppuna-gemma3-1b-it-q4km'")) {
    failures.push('localModel.ts: unexpected model id');
  }
  if (!/sha256:\s*'[a-f0-9]{64}'/i.test(modelSrc)) {
    failures.push('localModel.ts: sha256 digest must be configured');
  }
  if (!/expectedSize:\s*\d+/.test(modelSrc)) {
    failures.push('localModel.ts: expectedSize must be configured');
  }

  const pluginSrc = read(ASSET_PACK_PLUGIN);
  if (!pluginSrc.includes('install-time')) {
    failures.push('withAiModelAssetPack.js must use install-time delivery');
  }

  const requiredLicenses = [
    'GEMMA-NOTICE.txt',
    'GEMMA-TERMS-REFERENCE.md',
    'llama-rn-MIT.txt',
    'llama-cpp-MIT.txt',
  ];
  for (const file of requiredLicenses) {
    if (!fs.existsSync(path.join(LICENSES, file))) {
      failures.push(`assets/licenses/${file} is missing — run node scripts/sync-licenses.js`);
    }
  }

  if (failures.length > 0) {
    console.error('Model configuration validation FAILED:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('Model configuration validation passed.');
}

main();
