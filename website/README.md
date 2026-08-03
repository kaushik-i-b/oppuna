# Oppuna marketing website

Next.js (App Router) · TypeScript · Tailwind CSS · Lucide

See [`FEATURE_INVENTORY.md`](./FEATURE_INVENTORY.md) for verified features.

## Live site

**https://oppuna.com**

| Page | URL |
|------|-----|
| Home | https://oppuna.com/ |
| Privacy | https://oppuna.com/privacy/ |
| Terms | https://oppuna.com/terms/ |
| Support | https://oppuna.com/support/ |

Google Play: https://play.google.com/store/apps/details?id=com.oppuna.care

Configured in [`src/config/site.ts`](./src/config/site.ts) and [`src/config/paths.ts`](./src/config/paths.ts).

## GitHub Pages + custom domain

Workflow: [`.github/workflows/deploy-privacy.yml`](../.github/workflows/deploy-privacy.yml)

Builds a **root** static export (`NEXT_PUBLIC_BASE_PATH` empty) for the custom domain and publishes to `gh-pages` with `CNAME=oppuna.com`.

### Enable Pages (once)

1. Repo → **Settings → Pages**
2. Source: Deploy from branch **gh-pages** / **/(root)**
3. Custom domain: **oppuna.com** (and `www` if configured)
4. Actions → Workflow permissions: **Read and write**

Play Console privacy URL:

```
https://oppuna.com/privacy/
```

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

Asset helpers: `assetUrl`, `absoluteUrl`, `appPath` in `src/config/paths.ts`.

Internal legal checklist: [`LEGAL_REVIEW_REQUIRED.md`](./LEGAL_REVIEW_REQUIRED.md).
