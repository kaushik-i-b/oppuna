# Data protection model

Oppuna stores wellness data **only on the user's device**. This document describes what is protected, how, and known limitations.

## What is stored locally

| Data | Storage | Sensitivity |
| --- | --- | --- |
| Chat conversations | SQLite (`oppuna.db`) | High |
| Journal entries | SQLite | High |
| Mood history | SQLite | High |
| Safety / crisis events | SQLite | High |
| Voice note files | App sandbox filesystem | High |
| Settings / onboarding flags | AsyncStorage | Medium |
| App Lock enabled flag | SecureStore | Medium |
| Model verification metadata | AsyncStorage | Low |
| Temporary exports | Cache directory (deleted after share) | High |

## Protection mechanisms

### Android application sandbox

All app data lives in the per-app sandbox protected by the OS. Other apps cannot read Oppuna's private storage without a rooted/compromised device.

### Android backup disabled

`android:allowBackup=false` plus `backup_rules.xml` / `data_extraction_rules.xml` exclusions prevent Google Auto Backup and device-to-device cloud restore from copying Oppuna databases and files.

Validated by `npm run verify:privacy-config`.

### No network exfiltration path

Production builds block `android.permission.INTERNET`. A JavaScript network guard rejects outbound `fetch` / `XMLHttpRequest` to remote hosts.

### App Lock

Optional biometric / device-credential gate on launch and resume.

### Export hygiene

Exports are written to cache, shown through the system share sheet, then deleted. Stale exports are cleaned periodically.

### Screenshot blocking (selected screens)

Chat, journal editing, export, and the lock screen use `FLAG_SECURE` on Android.

### Logging

Production builds redact sensitive log context. Logs stay in a local in-memory ring buffer only — never transmitted.

## Database encryption status

**The SQLite database is not SQLCipher-encrypted** in the current Expo/React Native architecture.

Full SQLCipher integration would require a careful migration (new native module, key lifecycle, failure modes) and is not enabled to avoid destabilizing existing users.

### Current at-rest model

- OS-level device encryption (when the user enables a device lock / FDE)
- Android sandbox isolation
- Backup disabled
- No cloud sync

### Individual secrets

App Lock preference uses `expo-secure-store`, backed by Android Keystore where available.

## User responsibilities

- Enable a device screen lock
- Use Oppuna's optional App Lock for shared devices
- Export data deliberately; exported JSON is **not** encrypted by Oppuna
- Understand uninstall / clear storage permanently deletes local data

## Remaining limitations (P1)

| Risk | Mitigation today | Future option |
| --- | --- | --- |
| Rooted device file access | OS sandbox only | SQLCipher / field-level encryption |
| Physical device access without lock | App Lock optional | Stronger defaults / export warnings |
| Exported JSON readable | Warning + App Lock gate | Optional export password (not implemented) |

Do **not** claim end-to-end database encryption unless SQLCipher or equivalent is implemented and verified.
