# Production Android signing

Oppuna Android releases must be signed with credentials that **never** live in the git repository.

## Play App Signing

Enable **Google Play App Signing** when you create the Play Console app listing.
Google holds the app-signing key; you upload builds signed with an **upload key**.

Benefits:

- Google can re-sign if you rotate a compromised upload key
- You do not ship the long-lived app-signing key in CI artifacts

## Compromised upload key

If an upload keystore or its passwords were ever committed to source control (including this repository's history), treat that upload key as **compromised**.

**Required manual action:**

1. Enroll in Play App Signing if not already enrolled.
2. In Play Console → **Setup → App signing**, request an **upload key reset**.
3. Generate a new upload keystore in a secure environment (password manager / HSM / CI secret store).
4. Store the new keystore and passwords only in EAS credentials, GitHub Actions secrets, or another secret manager.
5. Revoke or destroy copies of the old upload key.

Oppuna does **not** generate or commit production keys in this repository.

## What must never be committed

- `*.keystore`, `*.jks`
- `keystore-credentials.txt` or similar password files
- Gradle `storePassword` / `keyPassword` literals
- Base64-encoded private keys in workflow files or docs

Patterns are blocked in `.gitignore` and checked in CI (`npm run verify:secrets`).

## Recommended credential flow

### EAS Build (preferred)

```bash
eas credentials --platform android
```

Store the upload keystore in EAS. Production profile builds (`npm run build:production`) use EAS-managed credentials.

Environment variable names expected for local Gradle signing (values from your secret manager only):

| Variable | Purpose |
| --- | --- |
| `OPPUNA_UPLOAD_STORE_FILE` | Keystore filename inside `android/app/` |
| `OPPUNA_UPLOAD_STORE_PASSWORD` | Keystore password |
| `OPPUNA_UPLOAD_KEY_ALIAS` | Key alias |
| `OPPUNA_UPLOAD_KEY_PASSWORD` | Key password |

### GitHub Actions

Add the four values above (and the keystore file as a base64 secret if needed) to **Repository secrets**.
Workflows reference secrets by name — never echo or log them.

### Local developers

Copy the keystore to a path outside the repo (e.g. `~/.oppuna/keystores/`) and export the environment variables in your shell profile or a local `.env` file that is gitignored.

## Verifying a release build

```bash
npm run inspect:android-release
npm run verify:production
```

These scripts validate SDK targets, backup settings, and absence of committed secrets — not signature correctness.
Use `jarsigner` / `apksigner verify` on the built artifact in your secure build environment.
