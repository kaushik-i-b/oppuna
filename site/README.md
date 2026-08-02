# Oppuna web pages

Static pages for Oppuna. No build step, no dependencies.

| File | Purpose |
|------|---------|
| [`home.html`](home.html) | Marketing homepage (Sage brand) |
| [`index.html`](index.html) | Privacy policy (Play Store / store listing URL) |
| [`pitch-deck.html`](pitch-deck.html) | Investor pitch |
| [`SQUARESPACE.md`](SQUARESPACE.md) | How to rebuild `home.html` on Squarespace |
| [`favicon.svg`](favicon.svg) | Site icon |

## Preview the homepage locally

```bash
open site/home.html
```

Or from the repo root:

```bash
npx --yes serve site
```

Then open `http://localhost:3000/home.html`.

## Transfer to Squarespace

Follow [`SQUARESPACE.md`](SQUARESPACE.md): match Site Styles to the Sage palette, then paste section copy into Fluid Engine. Or drop `home.html` into a Squarespace Code block if your plan allows it.

## Privacy policy URL (Google Play)

Paste into **Play Console → App content → Privacy policy**:

```
https://kaushik-i-b.github.io/oppuna/
```

Google’s crawler must reach the page with no login and no password wall.

## Hosting on GitHub Pages

The workflow `.github/workflows/deploy-privacy.yml` publishes this `site/` folder.

1. **Repo → Settings → Actions → General → Workflow permissions:** Read and write permissions  
2. **Repo → Settings → Pages → Source:** GitHub Actions, or Deploy from branch `gh-pages` / `/ (root)`  
3. Run **Deploy privacy policy to GitHub Pages** (or push changes under `site/`)

Published base URL:

```
https://kaushik-i-b.github.io/oppuna/
```

Homepage (after deploy): `https://kaushik-i-b.github.io/oppuna/home.html`

## Hosting elsewhere

Drop the `site/` folder onto Netlify Drop, Cloudflare Pages, Vercel, or Surge. For Play Console, turn off any password protection.
