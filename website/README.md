# Oppuna Labs website

Next.js (App Router) static export · TypeScript · Tailwind CSS

The homepage is the Oppuna Labs company site. The Oppuna wellness application remains at `/oppuna/`, with privacy, terms, and support pages kept for the Play listing.

## Live site

**https://oppuna.com**

| Page | URL |
|------|-----|
| Oppuna Labs | https://oppuna.com/ |
| Oppuna product | https://oppuna.com/oppuna/ |
| Privacy | https://oppuna.com/privacy/ |
| Terms | https://oppuna.com/terms/ |
| Support | https://oppuna.com/support/ |

Google Play: https://play.google.com/store/apps/details?id=com.oppuna.care

Configured in [`src/config/site.ts`](./src/config/site.ts) and [`src/config/paths.ts`](./src/config/paths.ts).

## GitHub Pages

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

The workflow checks out the repo, installs dependencies, builds a **root** static export (`NEXT_PUBLIC_BASE_PATH` empty) for the custom domain, uploads a Pages artifact, and deploys with the official GitHub Pages actions.

`trailingSlash` is enabled, so each route is a real `index.html`. Refresh and direct links work on GitHub Pages without a client-side router fallback. `.nojekyll` is included so `_next` assets are served if a branch publish is ever used.

### Enable Pages (once)

1. Repo → **Settings → Pages**
2. **Source: GitHub Actions**
3. Custom domain: **oppuna.com** (the build writes `CNAME`)
4. Wait for the **Deploy website to GitHub Pages** workflow on `main`

If Pages is still set to **Deploy from a branch** (`gh-pages`), the new workflow cannot publish until the source is switched to GitHub Actions. The previous `gh-pages` branch is no longer updated by this workflow.

Play Console privacy URL:

```
https://oppuna.com/privacy/
```

### Project site without the custom domain

Set both variables before `npm run build`:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_BASE_PATH` | `/oppuna` |
| `NEXT_PUBLIC_SITE_URL` | `https://kaushik-i-b.github.io/oppuna` |

Asset helpers `assetUrl`, `absoluteUrl`, and Next `basePath` keep links and files under that subpath.

## Local development

```bash
cd website
npm install
npm run dev
```

## Production / static export

```bash
npm run lint
npm run typecheck
npm run build            # local export
npm run build:gh-pages   # production: empty base path + https://oppuna.com
```

## Build env

| Variable | Production (oppuna.com) | Local |
|----------|-------------------------|-------|
| `NEXT_PUBLIC_BASE_PATH` | empty | empty |
| `NEXT_PUBLIC_SITE_URL` | `https://oppuna.com` | `http://localhost:3000` (optional) |

The contact form opens a `mailto:` message to support@oppuna.com. It does not post to a backend.

Internal legal checklist: [`LEGAL_REVIEW_REQUIRED.md`](./LEGAL_REVIEW_REQUIRED.md).
