#!/usr/bin/env node
/**
 * Copies third-party license texts from installed packages into assets/licenses/.
 * Run after `npm install` when updating native dependencies.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'licenses');

const COPIES = [
  {
    dest: 'llama-rn-MIT.txt',
    src: path.join(ROOT, 'node_modules', 'llama.rn', 'LICENSE'),
  },
  {
    dest: 'llama-cpp-MIT.txt',
    src: path.join(ROOT, 'node_modules', 'llama.rn', 'cpp', 'LICENSE'),
  },
];

const REQUIRED_QWEN_NOTICE_SENTENCE =
  'Qwen is provided under and subject to the Apache License, Version 2.0';

const QWEN_NOTICE = `Qwen model notice — Oppuna
================================

${REQUIRED_QWEN_NOTICE_SENTENCE}

Oppuna distributes a quantized on-device language model derived from Alibaba Cloud's Qwen2.5 family.

Bundled model (production Android):
  Name: Qwen2.5 1.5B Instruct
  Format: GGUF (Q4_K_M quantization)
  Identifier: oppuna-qwen25-1_5b-instruct-q4km
  Upstream GGUF: bartowski/Qwen2.5-1.5B-Instruct-GGUF
  Delivery: Install-time Google Play Asset Delivery pack (ai_model_asset_pack)

By using Oppuna you agree to comply with the Apache License, Version 2.0 in addition to Oppuna's Terms of Use.

Oppuna-specific notes:
  - The model runs entirely on your device; Oppuna does not send prompts or outputs to any cloud AI service.
  - Model outputs may be inaccurate and must not be treated as medical or professional advice.
  - Redistribution of the model weights outside Oppuna is governed by the Apache License, Version 2.0.
  - Oppuna safety and guided offline fallbacks may block, replace, or override generative responses.

For the full Apache License, Version 2.0 text, see assets/licenses/QWEN-LICENSE.txt
`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-licenses] Missing source: ${src}`);
    return false;
  }
  fs.copyFileSync(src, dest);
  return true;
}

function main() {
  ensureDir(OUT);

  for (const { src, dest } of COPIES) {
    const outPath = path.join(OUT, dest);
    if (copyIfExists(src, outPath)) {
      console.log(`[sync-licenses] Wrote ${dest}`);
    }
  }

  fs.writeFileSync(path.join(OUT, 'QWEN-NOTICE.txt'), QWEN_NOTICE, 'utf8');
  console.log('[sync-licenses] Wrote QWEN-NOTICE.txt');

  const licensePath = path.join(OUT, 'QWEN-LICENSE.txt');
  if (!fs.existsSync(licensePath)) {
    console.warn(
      '[sync-licenses] QWEN-LICENSE.txt is missing — add the Apache License, Version 2.0 text before production.',
    );
  } else {
    console.log('[sync-licenses] QWEN-LICENSE.txt present');
  }
}

main();
