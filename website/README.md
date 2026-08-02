# Oppuna marketing website

Next.js (App Router) · TypeScript · Tailwind CSS · Lucide

See [`FEATURE_INVENTORY.md`](./FEATURE_INVENTORY.md) for verified features.

## Live download

Google Play: https://play.google.com/store/apps/details?id=com.oppuna.care

Configured in [`src/config/site.ts`](./src/config/site.ts) (`googlePlayUrl`, `supportEmail`).

## GitHub Pages (primary hosting)

Published URL:

```
https://kaushik-i-b.github.io/oppuna/
```

- Privacy: `https://kaushik-i-b.github.io/oppuna/privacy/`
- Terms: `https://kaushik-i-b.github.io/oppuna/terms/`
- Support: `https://kaushik-i-b.github.io/oppuna/support/`

Workflow: [`.github/workflows/deploy-privacy.yml`](../.github/workflows/deploy-privacy.yml)  
Builds a static export with `GITHUB_PAGES=true` (base path `/oppuna`) and pushes to the `gh-pages` branch.

### Enable Pages (once)

1. Repo → **Settings → Pages**
2. **Build and deployment → Source:** Deploy from a branch
3. Branch: **gh-pages** / folder: **/ (root)** → Save
4. Also set **Settings → Actions → General → Workflow permissions** to **Read and write**
5. Run **Deploy website to GitHub Pages** (Actions → Run workflow), or merge to `main`

### Update Play Store privacy URL

Point Play Console privacy policy to:

```
https://kaushik-i-b.github.io/oppuna/privacy/
```

(The site root is now the marketing homepage.)

## Local development

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

Routes: `/` · `/privacy` · `/terms` · `/support`

## Production / static export

```bash
npm run lint
npm run typecheck
npm run build            # local static export → website/out
npm run build:gh-pages   # same with /oppuna basePath
```

Serve the export locally:

```bash
npx serve out
```

## Configuration

Edit `src/config/site.ts`:

| Field | Status |
|-------|--------|
| `googlePlayUrl` | Set (live) |
| `supportEmail` | Set (`admin@adilakshmi.co` from Play) |
| `companyName` | Set (ADILAKSHMI INFOTECH PRIVATE LIMITED) |
| `siteUrl` | Set to GitHub Pages URL |
| `social.*` | Optional |

## Custom domain (Squarespace DNS → GitHub Pages)

1. Pages → Custom domain → add `yourdomain.com`
2. At your DNS host, add the records GitHub shows (usually A records to GitHub IPs + `www` CNAME)
3. After DNS works, set `siteUrl` to `https://yourdomain.com` and redeploy **without** `GITHUB_PAGES` basePath (or with apex hosting configured accordingly)

## Placeholders checklist

- [x] `siteUrl` — GitHub Pages
- [ ] Update Play Console privacy URL to `/privacy/`
- [ ] Legal review of `/privacy` and `/terms`
- [ ] Add real phone screenshots when available
- [ ] Optional social URLs

