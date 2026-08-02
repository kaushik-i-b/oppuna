# Oppuna marketing website

Next.js (App Router) · TypeScript · Tailwind CSS · Lucide

See [`FEATURE_INVENTORY.md`](./FEATURE_INVENTORY.md) for verified features.

## Live download

Google Play: https://play.google.com/store/apps/details?id=com.oppuna.care

Configured in [`src/config/site.ts`](./src/config/site.ts) (`googlePlayUrl`, `supportEmail`).

## Local development

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

Routes: `/` · `/privacy` · `/terms` · `/support`

## Production

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Configuration

Edit `src/config/site.ts`:

| Field | Status |
|-------|--------|
| `googlePlayUrl` | Set (live) |
| `supportEmail` | Set (`admin@adilakshmi.co` from Play) |
| `companyName` | Set (ADILAKSHMI INFOTECH PRIVATE LIMITED) |
| `siteUrl` | **PLACEHOLDER** — set before launch |
| `social.*` | Optional |

## Deploy on Vercel

1. Import the Git repo in Vercel  
2. Set **Root Directory** to `website`  
3. Deploy  
4. Set `siteUrl` to your custom domain and redeploy  

## Connect a Squarespace-registered domain to Vercel

1. Vercel → Project → Domains → add `yourdomain.com` / `www`  
2. In Squarespace Domains → DNS, add the A/CNAME records Vercel shows  
3. Remove conflicting old Squarespace hosting records if moving off Squarespace hosting  
4. Wait for DNS + HTTPS  

This Next.js app cannot run *on* Squarespace hosting; use Vercel/Netlify and point DNS.

## Placeholders checklist

- [ ] `siteUrl` — replace `https://PLACEHOLDER_YOUR_DOMAIN.com`  
- [ ] Legal review of `/privacy` and `/terms`  
- [ ] Add real phone screenshots when available  
- [ ] Optional social URLs  
