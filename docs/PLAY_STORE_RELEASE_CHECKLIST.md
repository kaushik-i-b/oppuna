# Google Play release checklist

Use this checklist before promoting a build to production. **Do not invent benchmark numbers** — fill in real device results from internal testing.

## Security

- [ ] Upload keystore stored only in EAS / secret manager (not git)
- [ ] Previously exposed upload key rotated via Play Console (if applicable)
- [ ] `npm run verify:secrets` passes
- [ ] Play App Signing enabled
- [ ] No signing passwords in workflow files or docs

## Privacy

- [ ] `npm run verify:privacy-config` passes (`allowBackup=false`)
- [ ] `npm run verify:offline` passes (INTERNET blocked)
- [ ] Data deletion tested (Settings → Delete all data)
- [ ] Export cleanup tested (`npm test -- dataExport`)
- [ ] Data Safety form reviewed (no collection declared)
- [ ] Health Apps declaration reviewed (wellness, not medical device)

## AI / Qwen

- [ ] Production AAB includes install-time asset pack with `model.gguf`
- [ ] `npm run verify:model` passes (SHA-256 + size configured)
- [ ] Airplane-mode inference tested on internal track
- [ ] Fallback tested (model missing / corrupt / timeout)
- [ ] Unsupported low-RAM device shows Guided Offline Mode
- [ ] Third-party licenses visible offline in app

### Device matrix (record real measurements)

| Device RAM | Init time (ms) | First response (ms) | Steady response (ms) | Peak memory (MB) | Crashes/ANR | Thermal/battery notes |
| --- | --- | --- | --- | --- | --- | --- |
| 4 GB | | | | | | |
| 6 GB | | | | | | |
| 8+ GB | | | | | | |

## Play Store listing

- [ ] Internal testing passed
- [ ] Closed testing passed (if required)
- [ ] Screenshots / description match on-device AI (not “rule-based only”)
- [ ] `docs/APP_STORE.md` copy reviewed
- [ ] Privacy policy URL works (web) + in-app Privacy Policy works offline
- [ ] Terms and Qwen notices accessible offline
- [ ] `npm run inspect:android-release` passes (target SDK, package id)

## Build verification

```bash
npm run verify:production
```

- [ ] All gates PASS on CI for release commit

## Post-release manual actions

- [ ] Monitor Play Console vitals (ANR/crash) — no third-party crash SDK in app
- [ ] Rotate upload key if any secret exposure suspected
