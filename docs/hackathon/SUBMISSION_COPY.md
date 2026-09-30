# Submission copy

Use these blocks as written. They match the app in this repository.

## Name

Oppuna Voice

## Tagline

Talk. Reflect. Remember — on your terms.

## One sentence

Oppuna Voice is a voice-first reflection companion that turns a natural conversation into a structured reflection and lets you choose what it may remember next time.

## Short description

Most journals start with an empty text box. Oppuna Voice starts by listening. You talk, interrupt, and correct yourself. When you ask, the conversation becomes a reflection. You check the lines that may be kept. A later conversation can continue only from those lines. It is a reflection companion, not a therapist and not a diagnosis.

## Full description

Conversations disappear. Reflection shouldn’t.

People often understand a day by talking. A journal asks them to stop, organize the feeling, and type it. Oppuna Voice removes that step. You open Talk to Oppuna and speak.

AssemblyAI’s Voice Agent is the conversation. One realtime session transcribes as you speak, detects the turn, speaks the reply, and stops when you interrupt. Oppuna does not bolt a separate speech-to-text engine, chat model, and voice together for this flow.

When there is something concrete to reflect on, you can ask for today’s reflection and name what to leave out. The app calls `save_reflection`, shows a preview, and lists memory suggestions. Only the lines you leave checked are stored for later. You can save the reflection with none of them. Excluded topics are stripped from the draft when the tool labels them, and they are not returned by later retrieval.

The next time you talk, that session is given only approved memories, and it is instructed to look them up with `get_recent_reflections` before it mentions the past. If nothing relevant was approved, it is told to say so rather than invent a history. Patterns across reflections appear only when at least two approved reflections exist in the window you asked about.

The live transcript is not long-term memory. Forget this conversation deletes that transcript and any unsaved draft. Lines you already approved stay until you remove them. Crisis language still routes to Oppuna’s existing crisis screen, and that event stores a category and a time, not the message.

## Problem

A blank journal asks for a finished paragraph at the moment a person is least able to write one. Press-to-record voice notes do not fix that. They still force a clip, a stop, and a wait. And if every word of a hard conversation is stored, people stop being honest.

## Solution

Voice, then a reflection, then an explicit yes.

You speak in a live session. You can interrupt and correct. You ask for a reflection. You see the suggestions. You decide. Later, continuity comes from that decision.

## AssemblyAI usage

Implemented in `AssemblyAIVoiceService`:

- A temporary token from `GET https://agents.assemblyai.com/v1/token`
- A session on `wss://agents.assemblyai.com/v1/ws`
- `session.update` with an inline prompt, the fixed greeting, PCM input and output, turn detection, and barge-in
- Microphone audio as `input.audio` (PCM16, 24 kHz)
- Live user transcripts, agent transcripts, and spoken `reply.audio`
- Interruption when the user speaks during a reply
- Client tools invoked with `tool.call`, answered with `tool.result`
- Reconnect via `session.resume`, then `session.end`

The voice is AssemblyAI’s “alba”. The greeting text is fixed: Oppuna introduces itself as a reflection companion, not a person and not a therapist.

## Technical implementation

Oppuna is an existing Expo app: journal, mood, breathing, and an on-device chat companion. Talk to Oppuna is a screen on top of that. It does not replace them.

Tools, all executed on device:

- `save_reflection` — draft only, after you agree
- `get_recent_reflections` — approved lines only
- `record_mood` — when you ask for a mood to be noted
- `get_reflection_patterns` — trends only with at least two approved reflections in 7 or 30 days

Persistence is SQLite on the device. The reflection preview is the screen titled “What should Oppuna remember?” Checked lines are what `user_approved` memory contains. The browser demo uses the Web Audio microphone. An Android test build can use a native PCM capture path. Production Android builds of the app still block general internet; the voice demo is the networked exception, on web or on a test build that allows it.

The API key stays in a local token server for the browser demo. A standalone phone build can embed a key at bundle time. That value is not committed.

## Originality

The new part is not “a voice chatbot.”

A typical assistant:

conversation → memory you cannot see

Oppuna Voice:

conversation → reflection → proposed lines → your approval → later context

You can keep “work has been stressful” and leave out the argument. The next conversation is not entitled to the transcript.

## Business value

The value is less friction at the moment of reflection, and a reason to come back.

- Talking is available while walking, commuting, or winding down, when typing a journal is not
- The result is a structured reflection, not only a transcript
- Continuity does not require storing every conversation
- The person can see and edit the memory, which is what makes a return visit trustworthy

Oppuna already ships as a private journaling and wellness app. Voice is the way into a reflection, not a second product category and not a clinical service. No market-size figure is claimed here.

## Privacy

- No account
- Journal, mood, and the voice transcript stay on the device
- Long-term voice memory is opt-in, line by line
- Ordinary app requests to the public internet stay blocked. The voice token request is the narrow exception, and only while it is in flight
- The voice screen on Android blocks screenshots
- The product does not diagnose, does not claim to be a therapist, and routes crisis language to the existing crisis screen

## Future

Not in this demo, and not claimed as done:

- Encrypting the local reflection tables
- More of Oppuna’s languages, using AssemblyAI’s multilingual voices
- A stored AssemblyAI agent configuration so the prompt need not be sent inline

Patterns over time are already implemented and refuse to invent a trend when the saved history is too small.

## What this is not

Not a therapist. Not a diagnosis. Not “ChatGPT with a microphone.” Not speech-to-text pasted into a journal. Not a claim that every conversation is remembered.
