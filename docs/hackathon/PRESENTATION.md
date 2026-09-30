# Presentation — 7 slides

16:9. One idea per slide. Large type. No logos besides the end line. Background: the app’s warm off-white, or near-black with white type. Accent: the existing sage green, used once per slide.

Speaker notes are for a live room. In the video, only slide 6 is shown, for about 20 seconds.

## Slide 1 — Title

**Layout:** Centered. Nothing else.

OPPUNA VOICE

Talk. Reflect. Remember — on your terms.

Voice-first reflection with user-controlled memory.

Powered by AssemblyAI.

**Notes:** Do not introduce the team. Go to the problem.

## Slide 2 — The problem

**Title:** Reflection has too much friction.

**Visual, left, four short lines with arrows:**

Think  
↓  
Organize  
↓  
Type  
↓  
Reflect

**Right, one sentence:**

A blank page asks you to organize a feeling before you’ve understood it.

**Notes:** People already process a day by talking. The app should not begin by demanding a paragraph.

## Slide 3 — The experience

**Title:** Just talk.

**One column:**

Voice  
↓  
Natural conversation  
↓  
Structured reflection  
↓  
You approve memory  
↓  
Continuity

**Footer line:**

The conversation can become a reflection without becoming permanent memory.

**Notes:** Name the path, not the stack. The demo already showed this.

## Slide 4 — Why AssemblyAI

**Title:** Voice isn’t an input method. It’s the interface.

**Four rows. Left is the product moment. Right is what the session actually does.**

| You see | The voice agent does |
| --- | --- |
| Words appear while you are still talking | Live transcript on the same socket |
| Oppuna answers without a record button | Turn detection inside the session |
| You talk over the reply and it stops | Barge-in (`interrupt_response`) |
| A reflection card appears after you agree | A client tool call, `save_reflection` |

**Footer:** One WebSocket. Microphone audio in. Spoken audio out. No separate speech-to-text, model, and voice stacked by us.

**Notes:** Do not list SDK names. The voice is AssemblyAI’s Voice Agent, voice “alba”, PCM at 24 kHz. The tools run in the app.

## Slide 5 — Memory

**Title:** You decide what Oppuna remembers.

**Diagram:**

Conversation  
↓  
Reflection  
↓  
Memory candidates  
↓  
Your approval  
↙          ↘  
Remember     Leave out  
↓  
Later context

**Footer:** Unchecked lines are not retrieved. A later session can use only what you kept.

**Notes:** This is the difference. A typical assistant keeps memory you never see. Oppuna shows the lines and waits.

## Slide 6 — Architecture

**Title:** One conversation. Local decisions.

**Diagram. Draw AssemblyAI as the only outside box.**

You  
↓  
Oppuna  
↓  
AssemblyAI Voice Agent  
hears · takes turns · speaks · can be interrupted  
↓  
Tools in the app  
save reflection · recall approved memory · note a mood · patterns when there is enough history  
↓  
On this device  
the lines you checked

**Notes, under 25 seconds:** Journal text is not the thing being uploaded. The voice session is the network path. Approved memory stays in the local database. Production Android builds of the rest of Oppuna still ship without general internet. This demo runs where the voice socket is allowed.

## Slide 7 — Close

**Title:** From a blank page to a conversation you can return to.

**Today, three lines:**

Natural voice conversations  
Structured reflections  
Memory you approve

**Tomorrow, smaller type, labeled Later:**

Richer history across many reflections  
Patterns only when the saved history supports them  
Voice in more of the languages Oppuna already lists  
Encrypted local reflection storage

**Close, large:**

Talk. Reflect. Remember — on your terms.

Oppuna Voice × AssemblyAI

**Notes:** Patterns already exist in the product and stay quiet until two approved reflections fall in the window. Do not present the Later column as shipped. Do not quote market size.
