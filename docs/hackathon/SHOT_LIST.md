# Shot list

Record in the browser at 1920×1080, 30 fps, system audio plus a close microphone for your voice. Oppuna’s voice comes from the computer speakers; headphones keep it out of the mic except for the interruption, where you want both voices.

Do one complete path first, then pick the clean takes. Do not assemble a success the app did not produce.

| # | Time | Frame | Record | Keep in the edit |
| --- | --- | --- | --- | --- |
| 1 | 0:00 | Home | Static home with **Talk to Oppuna** in frame. Notifications hidden. | 8–12 seconds |
| 2 | 0:20 | Home → voice | Cursor or finger taps **Talk to Oppuna**. | The tap and the open |
| 3 | 0:25 | Voice, connecting | Orb and **Connecting…**, then the greeting, then **Listening…** | Greeting plus the Listening label |
| 4 | 0:35 | First turn | You say the exhausting-day line. Quote updates on screen. | Your full sentence on screen |
| 5 | 0:55 | First reply | **Thinking…** then **Speaking…** and Oppuna’s text | Enough of the real reply to hear it respond |
| 6 | 1:35 | Interrupt | You talk over **Speaking…**. Label may show **Interrupted**. Playback stops. | The moment the voice cuts |
| 7 | 1:42 | Correction | “I couldn’t switch off after I came home.” Then Oppuna’s new reply | Both lines |
| 8 | 1:55 | Ask | “Can you turn this into today’s reflection? Leave out the argument.” | Your request, readable |
| 9 | 2:05 | Sheet | **Today’s reflection** and **What should Oppuna remember?** | The whole card |
| 10 | 2:10 | Choice | Uncheck any argument line. Edit checked lines if they are vague. **Save reflection** becomes **Saved** | The unchecked box and **Saved** |
| 11 | 2:20 | Title | Black frame, the word LATER | 1 second |
| 12 | 2:22 | Return | Browser Back to Home, tap **Talk to Oppuna**, wait for **Listening** | Can be shortened |
| 13 | 2:30 | Recall | “I’ve been stressed again.” Then the live reply | The reply that uses approved context |
| 14 | 2:50 | Slide | Architecture slide, full frame | 20 seconds |
| 15 | 3:10 | Close | Voice orb or Home, then the end card | End card held |

## Do not record

- The API key, `.env`, the token server terminal, or a WebSocket URL with a token
- **Load demo history**, unless scene 13 failed and you are shooting a labeled backup. Those rows are prefixed `[Demo seed]` and can be spoken aloud
- **Forget this conversation** as if it were the memory step. After **Saved**, leave with browser Back
- A second monitor, browser console, or the on-device Qwen download. This demo does not use the local chat model
- The Android app’s voice screen. `FLAG_SECURE` blocks capture there
- Crisis-screen triggers. Do not read crisis phrases into the mic

## Backup takes

| If this happens | Do this |
| --- | --- |
| Greeting still playing | Wait. A sentence during the greeting becomes an interruption of the greeting |
| Oppuna guesses the wrong problem | That is the interruption take. Use it |
| Reflection card never appears | Ask once more, in one sentence, including what to leave out. If it still fails, stop and check the token server |
| Argument text is in the summary | Uncheck related memory lines. Use **Edit** to remove the sentence from the summary before save. Say so in narration only if you show the edit |
| Argument text is already absent | Do not add a fake checkbox. Narrate that it was left out |
| Second reply ignores the memory | Take again with “I’ve been stressed again, especially after work.” Do not write a reply in post |
| You need a memory before scene 1 works | In a dev build, **Load demo history** stores three approved lines and marks them as a demo seed. Prefer a real scene 1. If you use the seed, the title card must say it is sample history, and you must not pretend it came from the conversation you just had |

## Audio

- Your voice: narration can be recorded after, in a quiet room, to the script in `VOICEOVER.md`
- Oppuna’s voice: take it from the session recording. Do not replace it with another TTS pass
- Subtitles: narration throughout. Also subtitle your lines and Oppuna’s lines, verbatim
