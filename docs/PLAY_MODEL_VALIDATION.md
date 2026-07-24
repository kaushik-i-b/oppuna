# Play Internal Test — Qwen Model Validation

Use this checklist when validating the on-device Qwen2.5 1.5B model through Google Play Internal Testing. Do not mark production ready until every step passes on real hardware with a production AAB.

## Prepare

1. Confirm `config/local-model.json` matches `assets/ai-model/model.gguf` size/SHA.
2. Create a fresh production AAB (with `assets/ai-model/model.gguf` present and Qwen Apache-2.0 license assets).
3. Upload to Play Internal Testing and install on clean devices.

## Core checks

1. Fresh install completes (install-time asset pack delivered).
2. Airplane mode on.
3. Open Chat — model initializes or guided fallback is clear.
4. Confirm on-device model state = **ready**.
5. Send a short wellness message; receive a private local reply.
6. Confirm no network calls for inference.
7. Force-stop and reopen — model still works.
8. Settings → Legal → Third-Party Licenses / Qwen Information opens offline.
9. Corrupt GGUF (dev build only): app does not crash; guided mode works.
10. 4 GB / 6 GB / 8+ GB devices: record init time, latency, memory.
