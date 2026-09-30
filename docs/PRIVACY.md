# Oppuna Privacy Statement

_Last updated: 2026_

Oppuna is built around a single promise: **your private thoughts stay private, on your device.**

## What we collect

**Nothing leaves your phone.** Oppuna has no account system and no servers that receive your journal, mood notes, or chat content. Optional on-device funnel events (for example, first open or first mood logged) stay in local storage only, never include emotional free text, and are never uploaded. We — the developers — never receive, see, or store your personal entries.

## What is stored, and where

Everything you create in Oppuna is stored only in the app's local storage on your device:

- Conversations with the offline companion
- Mood check-ins (mood, intensity, notes, tags)
- Journal entries
- Breathing session history
- Voice notes you record (audio files stay in the app's private storage)
- App preferences (theme, language)
- Safety event metadata (only the category and time — never the message that triggered it)

This data is never uploaded, synced, backed up to a cloud, or shared with any third party by the app.

## Network

Your journal, mood, and chat are not uploaded. There are no advertising SDKs, no cloud analytics, and no remote telemetry. A JavaScript network guard blocks ordinary `fetch` and `XMLHttpRequest` calls to the public internet.

The on-device Qwen model is **not** inside the initial install. Google Play can download that pack when you ask, and a sideload build can fetch the same pinned file. That transfer is the model weights only. After the file is on the device and checked (size and SHA-256), chat runs locally and works in airplane mode. Guided replies work before the download.

Talk to Oppuna is a separate, optional voice session. It is documented in `docs/VOICE_ARCHITECTURE.md`.

## Microphone

If you choose to record a voice note, the app uses your microphone. Recordings are saved locally on your device and are never transmitted anywhere. You can delete them at any time.

## Your control over your data

- **Export:** Create a JSON copy of all your data. The file is written to your device; sharing it afterward is your choice and is handled by your operating system.
- **Delete:** Permanently erase all your data — conversations, moods, journals, breathing history, and voice notes — from Settings → Delete all data. This cannot be undone.

## Not a medical service

Oppuna is not a doctor, therapist, crisis service, or medical device. It does not diagnose, treat, cure, prevent, or replace professional care. It provides supportive wellness guidance only. If you are in danger or need medical help, contact your local emergency services immediately and reach out to someone you trust.

## Children

Oppuna is intended for general wellbeing and is not directed at children. Because no data ever leaves the device, the app does not collect personal information from anyone.

## Changes

Because Oppuna stores nothing remotely, any future change to this statement will simply ship with an app update and appear here and in the app under Settings → Privacy statement.
