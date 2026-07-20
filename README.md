# Oppuna 🌿

**Private mental wellness support, offline on your phone.**

Oppuna is a fully offline, privacy-first mental wellness companion built with React Native, Expo, and TypeScript. It works completely in airplane mode — no login, no backend, no analytics, no tracking, and no external API calls. Everything you write, record, and track stays on your device.

> **Important medical disclaimer**
> Oppuna is not a doctor, therapist, crisis service, or medical device. It does not diagnose, treat, cure, prevent, or replace professional care. It provides supportive wellness guidance only. If you are in danger or need medical help, contact your local emergency services right away.

---

## Features

- **On-device Llama mental-health agent** — an offline, Llama-powered chat companion (`src/ai/`) served locally through `llama.rn`. The orchestrator (`src/ai/engine.ts`) runs safety checks first, then the on-device Llama model (validated for safety), and gracefully falls back to the rule engine when no model is present. See [On-device Llama agent](#on-device-llama-agent).
- **Offline AI fallback** — a deterministic, on-device rule-based wellness engine (`src/ai/fallbackEngine.ts`) with intent, mood, and crisis detection plus CBT-style, mindfulness, and grounding responses.
- **Crisis safety flow** — detects suicide, self-harm, abuse, violence, medical emergencies, and severe panic, then stops normal coaching and shows a dedicated crisis support screen.
- **Mood tracker** — mood, 1–10 intensity, notes, tags, history, and weekly insights with a local chart.
- **Journal** — daily, gratitude, thought records, trigger reflections, and private notes with search and edit/delete.
- **Breathing exercises** — 4-4-6, box breathing, and a 5-minute calm session with an animated breathing circle and completion screen.
- **Grounding** — guided 5-4-3-2-1 senses exercise.
- **Sleep support** — wind-down checklist, gentle reminders, and a spoken wind-down (device TTS).
- **Voice mode** — device text-to-speech and offline local voice notes (on-device speech-to-text is architected for the future).
- **Self-care plan**, **Insights dashboard**, **Settings**, **Data export**, and **Delete all data**.
- **Dark/light/system themes**, **multilingual-ready architecture** (English, Spanish, Hindi included), accessibility support, haptics, and a reusable design system.

---

## Tech stack

- React Native `0.83` + Expo SDK `55` + TypeScript (strict)
- `expo-sqlite` for local, structured storage
- `zustand` for preferences state (persisted via AsyncStorage)
- `@react-navigation` (native-stack + bottom-tabs)
- `react-native-reanimated` + `react-native-svg` for animations and charts
- `expo-speech`, `expo-audio`, `expo-haptics`, `expo-file-system`, `expo-sharing`, `expo-localization`, `expo-secure-store`

---

## Project structure

```
src/
  app/          App composition root + bootstrap
  components/   Reusable design system (ui/) and domain components (domain/)
  constants/    App metadata, disclaimers, crisis resources, moods
  database/     SQLite client, schema/migrations, repositories
  hooks/        useTheme, useTranslation, useHaptics, useAppNavigation
  i18n/         Locales (en/es/hi) + translator
  navigation/   Root navigator, tabs, types, navigation theme
  screens/      All 18 screens, grouped by feature
  services/     offlineAI, networkGuard, dataExport
  store/        Zustand settings store
  theme/        Tokens, colors, ThemeProvider
  types/        Domain models + Result type
  utils/        id, date, logger
```

---

## Installation

```bash
npm install
```

## Run

```bash
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go / a development build. The app runs fully offline once installed.

## Type-check, lint, and test

```bash
npm run typecheck
npm run test
```

Unit tests cover the offline AI engine, crisis detection, and the mood/journal storage logic.

---

## Database schema

SQLite database `oppuna.db`, versioned with `PRAGMA user_version`. See `src/database/schema.ts`.

| Table | Key columns |
| --- | --- |
| `mood_entries` | `id`, `mood`, `intensity`, `note`, `tags` (JSON), `created_at` |
| `journal_entries` | `id`, `kind`, `title`, `body`, `created_at`, `updated_at` |
| `chat_sessions` | `id`, `title`, `created_at`, `updated_at` |
| `chat_messages` | `id`, `session_id` (FK → `chat_sessions`), `role`, `content`, `intent`, `mood`, `created_at` |
| `breathing_sessions` | `id`, `pattern`, `cycles`, `duration_sec`, `completed`, `created_at` |
| `safety_events` | `id`, `category`, `created_at` (metadata only — never the message text) |
| `voice_notes` | `id`, `uri`, `duration_sec`, `transcript`, `created_at` |

Preferences (theme, language, onboarding/disclaimer flags, app-lock flag) are stored locally via AsyncStorage through the Zustand `settingsStore`.

---

## Security & privacy

- **Network guard** (`src/services/networkGuard.ts`) wraps `fetch` and `XMLHttpRequest` and rejects any outbound request to a remote host. In production no code path can reach the internet; local dev tooling is allowed only under `__DEV__`.
- No login, no cloud sync, no analytics, no tracking.
- **Export** writes a local JSON file and uses the OS share sheet (user-controlled). **Delete all data** wipes every table and removes recorded voice files.
- App-lock is included as a preference placeholder, ready for device biometrics in a future update.

## On-device Llama agent

The chat companion is a Llama model that runs **entirely on the device** via
[`llama.rn`](https://github.com/mybigday/llama.rn) — no server, no network. The
pipeline lives in `src/ai/`:

- `engine.ts` — orchestrator called by the chat UI. Order per message: strict
  safety/crisis detection → on-device Llama (streamed, timeout-guarded, and
  checked by the response validator) → rule-based fallback → safe fallback.
- `localLLMClient.ts` — `llama.rn` GGUF inference client.
- `modelManager.ts` — discovers the GGUF in local storage and tracks lifecycle.
- `modelProvisioner.ts` — copies a **bundled** GGUF into local storage on first
  launch (offline, idempotent), so the agent is available without a download.
- `promptBuilder.ts` — builds the guardrailed mental-health system prompt.
- `responseValidator.ts` — rejects unsafe/off-policy generations.

### Adding a model

The repo ships without model weights (they are large). To enable the Llama
agent in a build:

1. Download a small, quantized instruction-tuned GGUF (e.g. **Llama 3.2 1B
   Instruct, Q4_K_M**).
2. Save it as `assets/models/oppuna-model.gguf`.
3. Point the config at it in `src/constants/app.ts`:

```ts
// src/constants/app.ts
bundledModelAsset: require('../../assets/models/oppuna-model.gguf'),
```

On first launch `provisionBundledModel()` copies it into
`{documentDirectory}models/oppuna-model.gguf`, `llama.rn` loads it, and chat
replies come from the on-device Llama agent (shown as `source: 'local-llm'` in
the response metadata). For local development you can instead side-load a
`.gguf` directly into that models directory.

## Roadmap-ready

The architecture is intentionally ready to grow into:

- on-device speech-to-text for voice mode,
- encrypted local storage (SQLCipher / secure keys).

See `docs/PRIVACY.md` and `docs/APP_STORE.md` for the privacy statement and store description draft.
