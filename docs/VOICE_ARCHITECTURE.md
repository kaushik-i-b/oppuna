# Oppuna Voice Architecture — “Talk to Oppuna”

> Hackathon project for the AssemblyAI Voice Agent Hackathon.
> One-line pitch: **“A voice-first reflection companion that turns natural
> conversations into user-controlled memories and meaningful reflections.”**

This document is the STEP 0 deliverable: what exists in the repo, what we
reuse, the minimum changes required, and the plan that was then implemented.
It is kept in sync with the code — do not treat it as a proposal.

---

## 1. What the repository already is

**Oppuna** (`oppuna@2.1.0`) is a fully offline, privacy-first mental-wellness
companion: React Native `0.83` + Expo SDK `55` + strict TypeScript, shipped via
EAS (`com.oppuna.care`). Key facts discovered by inspection:

| Concern | Current state | File(s) |
|---|---|---|
| Framework | RN + Expo, `index.ts` → `src/app/App.tsx` → `AppBootstrap` | `src/app/` |
| Navigation | Native-stack `RootNavigator` + bottom-tab `MainTabs` (Home, Plan, Journal, Chat, Profile) | `src/navigation/` |
| Chat | Session/message UI backed by SQLite, replies from `generateAIResponse` | `src/screens/chat/ChatScreen.tsx`, `src/ai/engine.ts` |
| Voice (old) | `VoiceMode` screen: TTS spoken guides (`expo-speech`) + recorded voice notes (`expo-audio`), **no STT, no turn-taking, no conversation** | `src/screens/chat/VoiceModeScreen.tsx` |
| On-device AI | `llama.rn` GGUF via Play Asset Delivery; provider abstraction + fake provider for tests; deterministic rule-based `fallbackEngine` | `src/ai/providers/`, `src/ai/fallbackEngine.ts` |
| Safety | `safetyEngine` runs **before** any AI processing; crisis → dedicated `CrisisScreen`; metadata-only `safety_events` | `src/ai/safetyEngine.ts`, `src/screens/crisis/` |
| Storage | `expo-sqlite` `oppuna.db`, versioned migrations (`PRAGMA user_version`), repositories per domain | `src/database/` |
| Journal schema | `journal_entries(id, kind, title, body, created_at, updated_at)`; kinds: daily/gratitude/thought/trigger/note | `src/database/schema.ts` |
| Mood tracking | `mood_entries(id, mood, intensity, note, tags JSON, created_at)` + weekly insights helper | `src/database/repositories/moodRepository.ts` |
| State | Zustand `settingsStore` (persisted via AsyncStorage): theme, palette, language, name, onboarding, disclaimer, app-lock, reminders, region | `src/store/settingsStore.ts` |
| Auth | None — no login by design | — |
| Backend/API | None — no backend by design | — |
| Privacy architecture | `networkGuard` monkey-patches `fetch`/`XMLHttpRequest` and **rejects every remote host** (local dev hosts allowed only under `__DEV__`); Android manifest blocks `INTERNET`; no analytics; user-controlled export + wipe | `src/services/networkGuard.ts`, `app.json`, `src/services/dataExport.ts` |
| Tests | Jest + `jest-expo`, `__tests__` colocated, native modules mocked in `jest.setup.js` | `jest.config.js` |

**Reusable for voice:** design system (`components/ui`), `Screen`, `Button`,
`Card`, `LivingLeaf` orb, haptics, theme, `safetyEngine`/`assessSafety`,
`generateAIResponse` (local brain), `moodRepository`, `journalRepository`,
SQLite migration pattern, logger (production-redacting), `createId`,
`expo-speech` TTS, `expo-audio` mic permissions.

**Deliberately NOT reused/replaced:** nothing above is rewritten. The old
`VoiceMode` screen stays untouched; on-device AI stays the default brain;
`networkGuard` default stays offline-only.

---

## 2. The core tension and how we resolve it

Oppuna promises *offline-only* (network guard + blocked `INTERNET`
permission). AssemblyAI is a *cloud* realtime API. These conflict.

Resolution (minimum change, privacy-preserving):

- Voice networking is **opt-in per session**: tapping “Talk to Oppuna” shows an
  explicit consent notice (“voice conversations use AssemblyAI cloud
  transcription…”) and only then is `AssemblyAI` traffic allowed.
- `networkGuard` gains a narrow allowlist — `*.assemblyai.com` (and only that)
  — gated behind an in-memory flag `setVoiceNetworkingEnabled(true/false)`
  that the voice session sets on start/end. Default remains fully blocked.
- No API keys in client source. Token minting happens server-side
  (`scripts/voice-token-server.js`); the app only ever holds a
  **short-lived temporary token** (`EXPO_PUBLIC_ASSEMBLYAI_*` documents the
  plumbing; see `.env.example`). Without a token the voice experience still
  works end-to-end via the on-device fallback brain — AssemblyAI is
  first-class but never a hard dependency for the demo.
- The reflection/memory model distinguishes **session context** (ephemeral,
  forgettable) from **approved long-term memory** (only what the user checks).

---

## 3. New architecture (“Talk to Oppuna”)

```
┌──────────────┐   mic PCM / typed fallback   ┌─────────────────────┐
│  TalkToOppuna │ ───────────────────────────▶ │ AssemblyAIVoiceSvc  │
│    Screen     │ ◀─────────────────────────── │  (adapter)          │
│  (orb + live  │  transcript.partial / final  │  RealtimeTranscriber│
│   transcript) │  turn events, TTS audio,     │  (+ local fallback) │
└──────┬───────┘  interruption                 └──────────┬──────────┘
       │                                                  │ final transcript
       │                                     ┌────────────▼──────────┐
       │                                     │ VoiceSessionController│
       │                                     │ state machine + tools │
       │                                     └────────────┬──────────┘
       │                                                  │ save_reflection (idempotent)
       │                                     ┌────────────▼──────────┐
       │                                     │ SQLite (migration 4)  │
       │                                     │ voice_sessions        │
       └────────────────────────────────────▶│ reflections           │
          approval UI (memory candidates)     │ reflection_memories   │
                                              └───────────────────────┘
```

### 3.1 Module map (`src/voice/`)

| File | Responsibility |
|---|---|
| `types.ts` | `VoiceState` union (IDLE…ERROR), transcript segment, reflection draft, memory candidate, tool-call record |
| `voiceLogger.ts` | Dev-only observable event log (`assemblyai:connected`, `turn`, `tool.*`, `interruption`, …); production logs redact content |
| `AssemblyAIVoiceService.ts` | Clean adapter over the `assemblyai` SDK (`RealtimeTranscriber`: `connect`, `sendAudio`, `transcript.partial/final`, `error`, `close`); connection state, reconnect with backoff, graceful terminate; **local-transport fallback** when no token is configured so the demo never hard-fails |
| `conversationEngine.ts` | Local fallback brain: safety-first reply composer. `assessSafety` → crisis script; else approved-memory retrieval → `generateAIResponse` with memory context; never diagnoses, never hardcodes the “wow” sentence |
| `tools.ts` | Tool definitions + `ToolExecutor`: `save_reflection` (idempotent by `toolCallId`, applies `excludedTopics`), `get_recent_reflections` (approved-only), `record_mood`, `get_reflection_patterns` (real data only, `7d`/`30d`) |
| `reflectionRepository.ts` | SQLite persistence + pure helpers: create/list/get reflection, approve/reject/edit memories, pattern aggregation, `forgetSession` (deletes session transcript + unsaved draft + candidates; never touches approved unrelated memories) |
| `VoiceSessionController.ts` | Deterministic state machine + transcript merging (partial→final, no duplicates) + interruption (generation counter discards stale replies, TTS stopped) + duplicate tool-call protection |
| `useVoiceSession.ts` | React binding of the controller (subscription → re-render), TTS playback via `expo-speech` |
| `demoSeed.ts` | Clearly-labelled, isolated `[DEMO]` seed data + cleanup; only invoked from demo mode |

### 3.2 Deterministic state machine

`IDLE → CONNECTING → LISTENING ⇄ {THINKING → SPEAKING} → SAVING → IDLE`,
with `INTERRUPTED` (SPEAKING → LISTENING on barge-in) and `ERROR` (from any
state, with recovery action back to IDLE). One state at a time; transitions
go through a single `transition(to, reason)` that logs in dev and ignores
illegal jumps. Interruption stops TTS immediately, bumps the generation
counter so late replies are dropped, and preserves context.

### 3.3 Tools (function-calling shape)

Tools are declared with JSON-schema input and executed by `ToolExecutor`
against the real SQLite store. `save_reflection` strips any sentence touching
an `excludedTopics` term before persisting; `memoryCandidates` are stored
unapproved and only `get_recent_reflections` returns `approved = 1` rows —
rejected memories are never retrieved.

### 3.4 Memory model (migration 4)

`voice_sessions(id, created_at, ended_at, transcript_json, status)` ·
`reflections(id, session_id, summary, mood, themes_json, concerns_json,
positive_moments_json, commitments_json, excluded_topics_json, user_approved,
is_demo, created_at)` ·
`reflection_memories(id, reflection_id, text, approved, created_at, updated_at)`.
Raw transcripts live only in `voice_sessions` until “Forget this conversation”
deletes them; long-term memory = approved `reflection_memories` rows.

---

## 4. Implementation order (as executed)

- **P0:** adapter + mic/audio + state machine + live transcript + TTS + interruption.
- **P1:** `save_reflection` tool + reflection preview UI + SQLite persistence.
- **P2:** memory candidates + explicit approval + approved-only retrieval (“wow moment”).
- **P3:** `get_reflection_patterns` + orb animations + polish.
- **P4:** “How Oppuna Voice works” section, README, tests, cleanup.

## 5. Verification

`npm run typecheck`, `npm run lint`, `npm run test` after each phase; the
voice test-suite (`src/voice/__tests__/`) covers reflection creation, memory
approval, rejected-memory exclusion, excluded-topic stripping, approved-only
retrieval, interruption transitions, duplicate tool-call protection, and
forget-conversation behavior. Known limitations are listed in the README.
