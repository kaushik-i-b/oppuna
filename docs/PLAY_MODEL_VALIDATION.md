# Play Internal Test — Qwen Model Validation

Use this checklist when validating the on-device Qwen2.5 1.5B model through Google Play Internal Testing. Do not mark production ready until every step passes on real hardware with a **fresh post-Qwen** production AAB.

## Before upload

1. Place `assets/ai-model/model.gguf` (Qwen2.5-1.5B-Instruct-Q4_K_M) matching `config/local-model.json`.
2. Create a fresh production AAB (with Qwen Apache-2.0 license assets).
3. Run:

```bash
npm run verify:production
npm run verify:aab -- path/to/fresh.aab
```

4. Confirm `verify:aab` reports PASS (not BLOCKED) for package, versionCode/Name, targetSdk ≥ 36, no INTERNET, `allowBackup=false`, install-time pack, model size/SHA, and **no Gemma-named assets**.
5. Reject any historical / obsolete pre-Qwen AAB under `release/` (legacy ~806 MB GGUF).

## On-device checks (airplane mode)

1. Fresh install from internal track.
2. First launch: model preparation completes or Guided Offline Mode is shown — no crash/ANR.
3. Settings → Retry AI setup recovers from a failed preparation when storage allows.
4. Chat: non-crisis message receives a local-llm or safe guided reply.
5. Crisis phrases never reach the model first (human-authored crisis reply).
6. Cancel an in-flight generation; UI recovers; late tokens ignored.
7. Keyboard does not cover the composer (Chat tab).
8. Settings → Legal → Third-Party Licenses / Qwen Information opens offline.

## RAM-tier matrix (record real numbers)

| Device RAM | Supported? | Init time (ms) | First response (ms) | Steady response (ms) | Peak memory (MB) | Crashes/ANR | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| < 3 GB | No (Guided Offline) | | | | | | Conservative unsupported floor for Qwen 1.5B Q4_K_M |
| 4 GB | Yes (low tier, ctx ≤ 2048, CPU) | | | | | | |
| 6 GB | Yes (medium, ctx ≤ 3072, CPU on Android) | | | | | | |
| 8+ GB | Yes (high, ctx 4096, CPU on Android) | | | | | | |

Do not invent benchmark numbers.
