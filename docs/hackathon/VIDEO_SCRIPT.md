# Oppuna Voice — video script

Target length: 3:00–3:30. Do not exceed 4:00.

Record the browser app (`npm run web` plus `npm run voice:token`). The Android voice screen sets `FLAG_SECURE`, so a phone recording of Talk to Oppuna can come out black.

Every spoken reply in the conversation is live. Do not paste, dub, or subtitle a line Oppuna did not actually say. Subtitles for the narration can be added in the edit. Subtitles for Oppuna must match the recording.

The screen shows the latest user line and the latest Oppuna line, not a full chat history. Hold each important line on screen before the next sentence replaces it. Subtitles keep the earlier lines.

## 0:00–0:20 — The empty page

**Screen:** Oppuna home, already past onboarding. The **Talk to Oppuna** button is visible. No logo sting.

**Narration:**

Most journaling apps begin with an empty text box. When you’ve had a difficult day, explaining everything in writing can be the hardest part.

**On screen:** Do not tap yet. Let the home screen read as a journal app, then move toward the button.

## 0:20–0:35 — The question

**Narration:**

So we asked a different question. What if reflection started with a conversation?

**Action:** Tap **Talk to Oppuna**.

**Expected:** The voice screen opens. Caption at the top: “A reflection companion. Not a therapist.” The orb moves through Connecting, then Oppuna speaks the fixed greeting: “Hi, I’m Oppuna. I’m a reflection companion, not a person and not a therapist. I’m listening.” Wait until the label says **Listening**. Do not talk over the greeting.

## 0:35–1:35 — The conversation

**Say, at a natural pace, once Listening is showing:**

Today was exhausting. Something happened at work and I’ve been thinking about it all evening.

**Show, and do not cut the wait down to nothing:**

- Label **Listening**, then **Thinking**, then **Speaking**
- Your words appearing in quotes, including a partial line if it updates
- Oppuna’s spoken reply, with the text under the quote

Let the reply finish far enough that a judge can hear it is a response to what you said, not a pre-written clip. Headphones on. Mic close. Room quiet.

**Narration under the reply, quiet, one sentence only if it fits:**

You just talk. Oppuna listens in the same turn.

If the narration crowds the reply, drop it. The reply is the proof.

## 1:35–1:55 — The interruption

**While the orb says Speaking,** start talking. Do not wait for a pause.

Wait — that’s not really what bothered me.

**Expected:** Playback stops. The label can flash **Interrupted**, then return to **Listening**. Late audio from the interrupted reply is discarded.

**Then say:**

I think I’m more frustrated because I couldn’t switch off after I came home.

**Expected:** Oppuna answers from the correction, not from the earlier guess.

**Narration, after the stop is visible:**

AssemblyAI’s voice agent is the conversation. It transcribes as you speak, takes the turn, speaks back, and stops when you interrupt. There is no record button.

## 1:55–2:20 — Reflection, then your decision

**When Listening returns, say this as one turn:**

Can you turn this into today’s reflection? Leave out the argument.

**Expected:** Oppuna calls `save_reflection`. The screen replaces the orb with **Today’s reflection**. Fields can include mood, summary, themes, a key realization, and an optional commitment. The heading **What should Oppuna remember?** lists suggestions. They start checked.

The app also strips any field that contains an excluded topic, but only if the tool labeled that topic. If a line about the argument is still there, uncheck it. That checkbox is the control that always works. If the argument never appears, leave the list as it is and let the narration say it was left out.

Before saving, the checked lines need to be usable later. Aim for two ideas, in your words or edited on screen:

- Work has been stressful recently
- Switching off after work has been difficult

Tap **Edit** if a suggestion is vague, fix the text, then **Done editing**. Uncheck anything specific you would not want recalled. Tap **Save reflection**. The button becomes **Saved**.

**Narration:**

Oppuna does not treat the conversation as permanent memory. It proposes a reflection, and you decide which lines survive.

Do not show **Forget conversation** in this shot. After a save it keeps approved lines, but the label is easy to misread.

## 2:20–2:50 — Later

**Transition title:** LATER

**Action:** Leave the voice screen with the browser Back control, return to Home, and tap **Talk to Oppuna** again. Wait out the greeting until **Listening**.

**Say:**

I’ve been stressed again.

**Expected:** A new session. Opening the session loads up to six approved memories into the prompt. Nothing unapproved is included. Oppuna is also told to call `get_recent_reflections` before it mentions the past. That tool returns approved lines that match what you just said, and nothing you unchecked. If the wording does not overlap, the tool can come back empty even though the prompt still has the approved lines. That is why the saved line should contain “stress” or “work”.

**Capture the actual reply.** Do not replace it with a written line. A successful take refers to stress, work, or switching off, because you approved that. If the reply is generic, stop and do another take. A stronger sentence, still natural, is: “I’ve been stressed again, especially after work.”

**Narration after the reply has landed:**

Oppuna isn’t remembering an unrestricted transcript. It’s continuing from context I explicitly allowed it to remember.

Patterns are real, but they stay empty until two approved reflections exist. Do not ask “how have I been doing lately?” in this cut unless that second saved reflection is already there.

## 2:50–3:10 — How it fits together

**Screen:** Slide 6 only. No terminal. No network panel.

**Narration:**

Your voice goes to AssemblyAI’s voice agent. That one session hears you, takes turns, speaks, and can stop when you interrupt. Oppuna’s tools turn the conversation into a reflection, a mood note, or a lookup of approved memory. What you check is what a later conversation can use. Everything else stays out.

## 3:10–3:30 — Close

**Screen:** The voice screen at rest, or Home with **Talk to Oppuna** visible. Then the end card.

**Narration:**

We started with a simple idea. Sometimes you don’t need another screen asking you to type how you feel. Sometimes you just need somewhere to talk.

Oppuna turns those conversations into reflections, and lets you decide what deserves to be remembered.

Talk. Reflect. Remember — on your terms.

This is Oppuna Voice, powered by AssemblyAI.

**End card, hold 3 seconds:**

OPPUNA VOICE  
Talk. Reflect. Remember — on your terms.  
Powered by AssemblyAI  

GitHub: the repository URL. No QR unless it resolves.
