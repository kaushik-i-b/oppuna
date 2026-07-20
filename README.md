# Oppuna 🌿

**Private mental wellness support, offline on your phone.**

Oppuna is a fully offline, privacy-first mental wellness companion built with React Native, Expo, and TypeScript. It works completely in airplane mode — no login, no backend, no analytics, no tracking, and no external API calls. Everything you write, record, and track stays on your device.

> **Important medical disclaimer**
> Oppuna is not a doctor, therapist, crisis service, or medical device. It does not diagnose, treat, cure, prevent, or replace professional care. It provides supportive wellness guidance only. If you are in danger or need medical help, contact your local emergency services right away.

---

## Features

- **On-device Llama mental-health companion** — a named agent (`src/ai/mentalHealthAgent.ts`) powered by a Llama GGUF model running through [`llama.rn`](https://github.com/mybigday/llama.rn). When a model is installed on the device the chat is answered by the LLM; when not, the same agent falls back to a deterministic rule-based wellness engine. Every path stays fully on-device.
- **Guided-response fallback** — a rule-based wellness engine (`src/ai/fallbackEngine.ts`) with intent, mood, and crisis detection plus CBT-style, mindfulness, and grounding responses. This is what the agent uses when no Llama model is installed.
- **Crisis safety flow** — detects suicide, self-harm, abuse, violence, medical emergencies, and severe panic, then stops normal coaching and shows a dedicated crisis support screen.
- **Response validator** — every LLM candidate reply is checked before it reaches the user; medical-diagnosis claims, therapy claims, medication advice, unsafe content, or repetitive replies are rejected and the rule engine takes over.
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

## Installing the on-device Llama mental-health agent

Oppuna's chat is answered by an on-device Llama model when one is present, and by the rule-based wellness engine otherwise. Because the model file is large and highly personal (it stays on the phone), the app never downloads one for the user — you install a local GGUF file yourself:

1. Download any Llama-compatible GGUF instruct model onto the phone (for example `Llama-3.2-1B-Instruct-Q4_K_M.gguf`, `Llama-3.2-3B-Instruct-Q4_K_M.gguf`, or `TinyLlama-1.1B-Chat-Q4_K_M.gguf`).
2. Open **Settings → Mental health companion** in Oppuna.
3. Tap **Choose a GGUF model file** and pick the file from Files / Downloads. Oppuna copies it into its private storage under `documentDirectory/models/`.
4. The chat screen shows the on-device Llama companion becoming ready. From then on, replies are generated locally by Llama, still filtered through the safety engine and response validator.

The model runs entirely on the device via `llama.rn`. Your chats, prompts, and the model file itself never leave the phone — Oppuna's `networkGuard` blocks outbound network calls in production.

## Roadmap-ready

The architecture is intentionally ready to grow into:

- bundled first-party Llama models delivered via app updates,
- on-device speech-to-text for voice mode,
- encrypted local storage (SQLCipher / secure keys).

See `docs/PRIVACY.md` and `docs/APP_STORE.md` for the privacy statement and store description draft.
