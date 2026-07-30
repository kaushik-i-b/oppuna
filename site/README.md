# Oppuna privacy policy site

A self-contained static privacy policy page (`index.html`) for Oppuna, ready to
host anywhere. It has no build step and no dependencies.

## Google Play Console URL

Paste this into **Play Console → App content → Privacy policy**:

```
https://kaushik-i-b.github.io/oppuna/
```

Google’s crawler must reach the page with no login and no password wall.

## Hosting on GitHub Pages (free, permanent)

A workflow at `.github/workflows/deploy-privacy.yml` publishes this `site/`
folder to GitHub Pages. To make it live:

1. **Repo → Settings → Actions → General → Workflow permissions:** choose
   **Read and write permissions**, then save.
2. **Repo → Settings → Pages → Build and deployment → Source:** choose
   **GitHub Actions**.
   - This repo is public, so Pages is available on the free plan.
3. Run the **"Deploy privacy policy to GitHub Pages"** workflow (Actions tab →
   Run workflow). It also runs automatically on pushes to `main` that touch
   `site/`.

If the workflow fails with `Resource not accessible by integration`, step 1 or
2 above is still missing — fix those settings and re-run.

The published URL will be:

```
https://kaushik-i-b.github.io/oppuna/
```

## Hosting anywhere else (free, drag-and-drop)

Because it is a single static folder, you can also drop `site/` (or
`oppuna-privacy-site.zip` at the repo root) onto any static host, e.g.:

- **Netlify Drop:** https://app.netlify.com/drop — after upload, **claim the
  site** and **turn off password protection** before using the URL in Play
  Console.
- **Cloudflare Pages**, **Vercel**, or **Surge**.
