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

- [ ] **Fresh** production AAB includes install-time asset pack with Qwen `model.gguf` (986,048,768 bytes)
- [ ] `npm run verify:no-stale-model` passes
- [ ] `npm run verify:model` passes (SHA-256 + size + GGUF architecture)
- [ ] `npm run verify:aab -- <fresh.aab>` passes (not BLOCKED; no Gemma assets)
- [ ] Airplane-mode inference tested on internal track
- [ ] Fallback tested (model missing / corrupt / timeout)
- [ ] Unsupported low-RAM (<3 GB) device shows Guided Offline Mode
- [ ] Third-party Qwen / Apache-2.0 licenses visible offline in app
- [ ] Do **not** upload historical / obsolete pre-Qwen AABs from `release/`

### Device matrix (record real measurements)

| Device RAM | Init time (ms) | First response (ms) | Steady response (ms) | Peak memory (MB) | Crashes/ANR | Thermal/battery notes |
| --- | --- | --- | --- | --- | --- | --- |
| 4 GB | | | | | | |
| 6 GB | | | | | | |
| 8+ GB | | | | | | |

## Play Store listing

**Privacy policy URL for Play Console (App content → Privacy policy):**

```
https://kaushik-i-b.github.io/oppuna/
```

Hosted from `site/` via GitHub Pages. If that URL 404s, enable Pages (see `site/README.md`) and re-run **Deploy privacy policy to GitHub Pages**, then paste the URL above into Play Console. Do not use temporary tunnels or password-protected Drop links — Play crawlers must load the page publicly.

- [ ] Internal testing passed
- [ ] Closed testing passed (if required)
- [ ] Screenshots / description match on-device Qwen AI (not “rule-based only”)
- [ ] `docs/APP_STORE.md` copy reviewed
- [ ] Privacy policy URL `https://kaushik-i-b.github.io/oppuna/` loads publicly (no login / password)
- [ ] In-app Privacy Policy works offline
- [ ] Terms and Qwen notices accessible offline
- [ ] `npm run inspect:android-release` passes (targetSdk ≥ 36, package id)
- [ ] `android.versionCode` in `app.json` is **strictly greater** than every previously uploaded Play artifact for this applicationId (`com.oppuna.care`; latest local builds used versionCode 6)

## Build verification

```bash
npm run verify:production
npm run verify:aab -- path/to/fresh-qwen.aab
```

- [ ] All gates PASS on the release machine for the release commit
- [ ] AAB validation is PASS (failures or BLOCKED ⇒ do not ship)

## Post-release manual actions

- [ ] Monitor Play Console vitals (ANR/crash) — no third-party crash SDK in app
- [ ] Rotate upload key if any secret exposure suspected
