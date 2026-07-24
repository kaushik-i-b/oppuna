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

const REQUIRED_GEMMA_NOTICE_SENTENCE =
  'Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms';

const GEMMA_NOTICE = `Gemma model notice — Oppuna
================================

${REQUIRED_GEMMA_NOTICE_SENTENCE}

Oppuna distributes a quantized on-device language model derived from Google's Gemma family.

Bundled model (production Android):
  Name: Google Gemma 3 1B Instruct
  Format: GGUF (Q4_K_M quantization)
  Identifier: oppuna-gemma3-1b-it-q4km
  Delivery: Install-time Google Play Asset Delivery pack (ai_model_asset_pack)

By using Oppuna you agree to comply with the Gemma Terms of Use in addition to Oppuna's Terms of Use.

Oppuna-specific notes (the official Gemma terms control):
  - The model runs entirely on your device; Oppuna does not send prompts or outputs to Google.
  - Gemma outputs may be inaccurate and must not be treated as medical or professional advice.
  - Redistribution of the model weights outside Oppuna is governed by Google's terms.
  - Oppuna safety and guided offline fallbacks may block, replace, or override generative responses.

For the full Gemma Terms of Use text, see assets/licenses/GEMMA-TERMS-OF-USE.txt
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

  fs.writeFileSync(path.join(OUT, 'GEMMA-NOTICE.txt'), GEMMA_NOTICE, 'utf8');
  console.log('[sync-licenses] Wrote GEMMA-NOTICE.txt');
  const termsPath = path.join(OUT, 'GEMMA-TERMS-OF-USE.txt');
  if (!fs.existsSync(termsPath)) {
    console.warn(
      '[sync-licenses] GEMMA-TERMS-OF-USE.txt is missing — add authoritative Google Gemma terms before production.',
    );
  }
}

main();
