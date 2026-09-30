# Demo checklist

Run this the day of the recording, on the same machine you will capture. The path is the browser. Do not screen-record the Android voice screen: that screen blocks capture.

## Before you open the app

- [ ] Quiet room. Phone on silent. Desktop notifications off. Other calls quit
- [ ] Chrome or the Expo web window at 1920×1080. Browser chrome hidden if you can do it without hiding the page
- [ ] Headphones available. Use speakers only if you can keep Oppuna’s voice from looping into the mic. Echo makes barge-in fire on Oppuna’s own voice
- [ ] `.env` has `ASSEMBLYAI_API_KEY`. The file is gitignored. It must not appear on screen
- [ ] `npm run voice:token` is running and answers on port 8787
- [ ] `npm run web` is running
- [ ] Mic permission already granted, from a rehearsal, so the permission prompt is not in the final take
- [ ] Onboarding is finished. The first frame is Home
- [ ] Display name is empty or a name you are willing to show
- [ ] A rehearsal conversation used a fictional workday. No real coworker, manager, or workplace name

## Database

- [ ] You know whether approved reflections already exist. A leftover approval will be in the next session’s prompt
- [ ] For a clean story, delete app data or forget older voice memories so scene 2 is not greeted with someone else’s history
- [ ] Do not tap **Load demo history** before the hero take. It writes approved lines tagged `[Demo seed]`, and the model may say that phrase
- [ ] After scene 1 is saved, confirm **Saved** before you leave. Scene 2 only works if those lines are approved

## Scene checks, in order

- [ ] Home shows **Talk to Oppuna**
- [ ] Voice screen shows “Not a therapist”
- [ ] Greeting plays, then the label is **Listening**
- [ ] Your first sentence appears in quotes
- [ ] Oppuna speaks a reply that is about that sentence
- [ ] Talking during **Speaking** stops the audio
- [ ] The correction about switching off gets its own reply
- [ ] “Turn this into today’s reflection. Leave out the argument.” brings up **Today’s reflection**
- [ ] **What should Oppuna remember?** is on screen
- [ ] Any line about the argument is unchecked, or already absent
- [ ] At least one checked line contains the idea of stress or work, so “I’ve been stressed again” can match. Use **Edit** if the suggestion is vague. Checked lines start checked; you must opt out
- [ ] **Save reflection** shows **Saved**
- [ ] You return with browser Back, not by performing Forget on camera
- [ ] Second session: you say you have been stressed again, and the live reply uses approved context
- [ ] You did not type that reply in the editor

## If you have time after the hero cut

- [ ] With two approved reflections, ask how you have been doing lately. Patterns may show. With one, the honest result is that there is not enough history. Either result is valid. Do not fake a trend
- [ ] **Forget this conversation** on an unsaved visit clears the transcript and the draft, and leaves older approved lines in place

## Do not claim in the cut

- [ ] A specific sentence Oppuna will say in scene 2 or scene 6. Capture the real one
- [ ] That saying “leave out the argument” always deletes it from the summary. The reliable control is the checkbox, plus **Edit** on the summary. The tool strips a topic when that topic string was labeled
- [ ] Clinical benefit, diagnosis, or therapy
- [ ] That the on-device Qwen model is part of this voice session. It is not
- [ ] Market size, download counts, or revenue

## Technical confidence

- [ ] Console has no red error on the voice screen during the take
- [ ] The token server stayed up for both sessions
- [ ] You have two good interruption takes and two good recall takes
- [ ] Subtitles are drafted from the narration script and then corrected to the words actually heard
- [ ] End card has the repo URL you intend to submit

## Recording settings

- [ ] 1920×1080, 30 fps
- [ ] Cursor hidden except for the tap
- [ ] No token, key, or `.env` in frame
- [ ] Export with Oppuna’s audio intact. Do not replace it
