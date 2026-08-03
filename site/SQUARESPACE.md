# Transfer Oppuna homepage to Squarespace

Open the finished design locally first:

```bash
open site/home.html
```

Squarespace does not import full HTML sites. Rebuild the page with Fluid Engine using the copy and styles below (about 30–45 minutes).

## Site styles (Design → Site Styles)

| Token | Value |
|-------|-------|
| Primary / accent | `#3D6B5A` |
| Primary dark | `#2F5446` |
| Soft sage | `#DCE8E2` |
| Page background | `#F7F4EF` |
| Surface / cards | `#FFFCF8` |
| Text | `#1C2420` |
| Muted text | `#5A675F` |
| Heading font | Fraunces (or closest serif: Cormorant / Recoleta) |
| Body font | Outfit (or closest sans: DM Sans / Manrope) |
| Button shape | Pill / fully rounded |

Upload brand assets from the repo:

- `assets/icon.png` — favicon / nav mark
- `assets/splash-icon.png` or `assets/feature-image.png` — hero visual
- Leaf SVG is embedded in `home.html` (copy from the hero `<svg class="leaf">` if needed)

## Page structure

Create one page: **Home** (set as homepage).

Optional later: Privacy (link to existing `index.html` / GitHub Pages, or paste `docs/PRIVACY.md`), Features, Download.

---

### Section 1 — Hero (full-bleed)

Background: solid `#3D6B5A` or gradient `#4A8570` → `#3D6B5A` → `#2F5446`.  
Text: white. Layout: brand + copy left, leaf/icon right (or centered on mobile).

**Brand (H1)**  
Oppuna

**Headline**  
Private AI for your thoughts

**Supporting**  
Private mental wellness support, offline on your phone. No account. No cloud. No tracking.

**Primary button** → `#download` or store URL  
Get the app

**Secondary button** → `#privacy`  
Why offline

Keep the first viewport lean: brand, one headline, one sentence, CTAs, one visual. No feature grids or badges on the hero.

---

### Section 2 — Features

**Label**  
Features

**Heading**  
A calm space that stays on your phone

**Lede**  
Journal, track moods, breathe, and talk with an on-device companion — all without an internet connection.

| Title | Body |
|-------|------|
| Daily plan | A gentle, personalized wellness plan shaped around your mood, goals, and time. |
| Mood & journal | Log feelings, write freely, and review patterns — searchable, editable, deletable. |
| Breathe & ground | Guided breathing, 5-4-3-2-1 grounding, and a soft sleep wind-down. |
| On-device AI | Chat with a local companion. Safety checks and guided fallbacks — no cloud. |
| Your control | App lock, export everything as JSON, or permanently delete all data. |

Use a simple stacked list or two-column text — avoid busy card grids.

---

### Section 3 — Privacy

Background: soft `#EEF4F0` or `#DCE8E2` tint.

**Label**  
Privacy

**Heading**  
Privacy by architecture, not policy

**Lede**  
Nothing you write, record, or track leaves your device. Oppuna blocks outbound network access in production — there is no path to the cloud.

| Title | Body |
|-------|------|
| No account | Open the app and begin. No sign-up, no email, no profile in the cloud. |
| No cloud | On-device AI and local storage. Works in airplane mode, anywhere. |
| No tracking | No ads, analytics, or telemetry. Your mind is not a product. |

Link: Privacy policy → your live privacy URL (currently `https://kaushik-i-b.github.io/oppuna/` or `index.html` on this site).

---

### Section 4 — How it works

**Label**  
How it works

**Heading**  
Start gently. Stay private.

**Lede**  
Thoughts, feelings, and small actions shape each other. Oppuna helps you notice them — offline, at your pace.

1. **Choose your language** — Pick the language that feels most like home.  
2. **Shape a plan** — Share your mood, goals, and how much time you have today.  
3. **Understand privacy** — See how offline AI and local data keep everything yours.  
4. **Begin** — Journal, breathe, check in — or just sit with a quiet companion.

---

### Section 5 — Download (CTA band)

Background: `#3D6B5A` → `#2F5446`. Text: white.

**Heading**  
Peace of mind. On your terms. Offline.

**Body**  
A calm, private space to journal, track moods, and breathe. Fully offline. Your data never leaves your phone.

**Button**  
Get Oppuna on Google Play  
URL: `https://play.google.com/store/apps/details?id=com.oppuna.care`

---

### Footer

**Links**  
Privacy policy · Features · Download

**Disclaimer**  
Oppuna is not a doctor, therapist, crisis service, or medical device. It does not diagnose, treat, cure, prevent, or replace professional care. If you are in danger or need immediate help, contact your local emergency services right away.

**Closing line**  
Built to work offline. No account, no cloud, no tracking.

---

## Optional: Code Block shortcut

If you prefer a near-pixel match: create a blank page → add a **Code** block → paste the full contents of `home.html` (from `<!DOCTYPE html>` through `</html>`).

Notes:

- Some Squarespace plans restrict custom code; Business plan or higher is typically required for Code blocks / injection.
- External Google Fonts may need to stay; or switch to fonts available in Site Styles.
- After connecting your domain, update the Play Store privacy URL to your Squarespace privacy page if you host it there.

## Domain reminder

1. Squarespace → Settings → Domains → Use a domain I own → Connect  
2. Add DNS records at your registrar  
3. Set this Home page as the site homepage  
4. Publish
