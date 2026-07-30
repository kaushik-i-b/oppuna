# Oppuna privacy policy site

A self-contained static privacy policy page (`index.html`) for Oppuna, ready to
host anywhere. It has no build step and no dependencies.

## Google Play Console URL

Paste this into **Play Console → App content → Privacy policy**:

```
https://kaushik-i-b.github.io/oppuna/
```

Google’s crawler must reach the page with no login and no password wall.

## Hosting on GitHub Pages (required once)

The `gh-pages` branch already contains this site. The workflow
`.github/workflows/deploy-privacy.yml` keeps that branch updated whenever
`site/` changes on `main` (or when you run it manually).

### Turn the site on (one setting)

1. Open **Repo → Settings → Pages**
2. Under **Build and deployment → Source**, choose **Deploy from a branch**
3. Branch: **gh-pages** / folder: **/ (root)** → **Save**
4. Wait ~1 minute, then open https://kaushik-i-b.github.io/oppuna/

Also set **Settings → Actions → General → Workflow permissions** to
**Read and write permissions** so future workflow runs can update `gh-pages`.

### Re-publish

Actions → **Deploy privacy policy to GitHub Pages** → **Run workflow**

## Hosting anywhere else (free, drag-and-drop)

Because it is a single static folder, you can also drop `site/` (or
`oppuna-privacy-site.zip` at the repo root) onto any static host, e.g.:

- **Netlify Drop:** https://app.netlify.com/drop — after upload, **claim the
  site** and **turn off password protection** before using the URL in Play
  Console.
- **Cloudflare Pages**, **Vercel**, or **Surge**.
