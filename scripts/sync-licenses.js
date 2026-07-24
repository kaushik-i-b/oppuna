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

const GEMMA_NOTICE = `Gemma model notice — Oppuna
================================

Oppuna distributes a quantized on-device language model derived from Google's Gemma family.

Bundled model (production Android):
  Name: Google Gemma 3 1B Instruct
  Format: GGUF (Q4_K_M quantization)
  Identifier: oppuna-gemma3-1b-it-q4km
  Delivery: Install-time Google Play Asset Delivery pack (ai_model_asset_pack)

Use of the Gemma model weights is subject to Google's Gemma Terms of Use, published at:
  https://ai.google.dev/gemma/terms

By using Oppuna you agree to comply with those terms in addition to Oppuna's Terms of Use.

Key points (summary — the official terms control):
  - The model runs entirely on your device; Oppuna does not send prompts or outputs to Google.
  - Gemma outputs may be inaccurate and must not be treated as medical or professional advice.
  - Redistribution of the model weights outside Oppuna is governed by Google's terms.

For the full Gemma Terms of Use text, see assets/licenses/GEMMA-TERMS-REFERENCE.md
`;

const GEMMA_TERMS_REFERENCE = `# Gemma Terms of Use — reference

Oppuna includes **Google Gemma 3 1B Instruct** model weights (GGUF, Q4_K_M) for fully offline on-device inference.

## Official terms

The Gemma model is licensed under **Google's Gemma Terms of Use**, not Oppuna's software license.

Official publication (for human review when online):
https://ai.google.dev/gemma/terms

This app bundles a reference copy for offline access. The authoritative version is always the text published by Google. If bundled text and the official site differ, the official site controls.

## Model card references

- Gemma 3 1B Instruct: https://ai.google.dev/gemma/docs/core/model_card_3
- Hugging Face model page: https://huggingface.co/google/gemma-3-1b-it

## Your responsibilities

When using Oppuna's on-device AI features you must:

1. Comply with Google's Gemma Terms of Use.
2. Not use the model for prohibited purposes described in those terms.
3. Understand that AI outputs may be inaccurate and are not medical, therapeutic, or emergency care.

Oppuna applies additional safety checks and guided offline fallbacks that may override model output.
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
  fs.writeFileSync(path.join(OUT, 'GEMMA-TERMS-REFERENCE.md'), GEMMA_TERMS_REFERENCE, 'utf8');
  console.log('[sync-licenses] Wrote GEMMA-NOTICE.txt and GEMMA-TERMS-REFERENCE.md');
}

main();
