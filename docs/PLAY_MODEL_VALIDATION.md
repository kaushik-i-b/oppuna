# Play Internal Test — Gemma Model Validation

Use this checklist when validating the on-device Gemma 3 1B model through Google Play Internal Testing. Do not mark production ready until every step passes on real hardware with a production AAB.

## Pre-upload validation

1. Increment Android `versionCode` in `app.json`.
2. Create a fresh production AAB (with `assets/ai-model/model.gguf` present and authoritative `GEMMA-TERMS-OF-USE.txt`).
3. Run all production validation commands:

```bash
npm run verify:production
OPPUNA_PRODUCTION_VALIDATE=1 npm run verify:model
npm run verify:aab -- path/to/your-release.aab
```

4. Run `verify:aab` on that exact AAB artifact.
5. Upload the AAB to Google Play Internal Testing.

## On-device validation workflow

6. Install through the Play Store (not sideload).
7. Wait for complete installation (including install-time asset pack).
8. Launch Oppuna.
9. Open **Settings → Production Readiness** (or AI diagnostics).
10. Confirm Gemma model state = **ready**.
11. Send a test message in chat.
12. Confirm response source = **local-llm** (visible in developer diagnostics).
13. Enable airplane mode.
14. Force stop Oppuna.
15. Relaunch Oppuna.
16. Send several messages.
17. Confirm response source remains **local-llm**.
18. Reboot the phone while offline.
19. Relaunch Oppuna.
20. Confirm Gemma still works.
21. Background/foreground the app repeatedly.
22. Confirm the model is **not** recopied unnecessarily (check diagnostics / logs).
23. Confirm no crash or ANR.

## Test devices

Run on representative hardware:

| Tier | RAM |
|------|-----|
| Low | 4 GB |
| Mid | 6 GB |
| High | 8+ GB |

## QA measurement fields

Record actual measurements — do not invent results.

| Field | Value |
|-------|-------|
| Device | |
| Android version | |
| RAM | |
| Free storage before install | |
| Installed app storage | |
| Model preparation duration | |
| Model load duration | |
| First token latency | |
| Full response latency | |
| Peak memory (if measured) | |
| Thermal behavior | |
| Battery impact | |
| Crash | |
| ANR | |
| Offline inference confirmed | |
| Response source | |
| **PASS/FAIL** | |

## Pass criteria

- Model state reaches **ready** after Play install.
- Chat responses show source **local-llm** (not rule-engine or fallback) when the model is healthy.
- Offline operation works after force-stop, relaunch, and reboot.
- No duplicate model copy on routine background/foreground.
- No crashes or ANRs during the session.

## Fail criteria

- Model state stuck in copying, verifying, corrupted, insufficient-storage, or fallback-mode.
- Responses consistently show rule-engine / error-fallback when the model should be ready.
- App crashes or ANRs during model preparation or inference.
- `verify:aab` fails on the uploaded artifact.
