# Oppuna privacy policy site

A self-contained static privacy policy page (`index.html`) for Oppuna, ready to
host anywhere. It has no build step and no dependencies.

## Hosting on GitHub Pages (free)

A workflow at `.github/workflows/deploy-privacy.yml` publishes this `site/`
folder to GitHub Pages. To make it live:

1. **Repo → Settings → Actions → General → Workflow permissions:** choose
   **Read and write permissions**, then save.
2. **Repo → Settings → Pages → Build and deployment → Source:** choose
   **GitHub Actions**.
   - Note: publishing a **private** repository to Pages requires GitHub Pro,
     Team, or Enterprise. On the free plan, either make the repo public or use
     one of the alternative hosts below.
3. Run the **"Deploy privacy policy to GitHub Pages"** workflow (it also runs
   automatically on pushes to `main` that touch `site/`).

The published URL will be:

```
https://kaushik-i-b.github.io/oppuna/
```

## Hosting anywhere else (free, drag-and-drop)

Because it is a single static folder, you can also drop `site/` onto any static
host, e.g.:

- **Netlify Drop:** https://app.netlify.com/drop
- **Cloudflare Pages**, **Vercel**, **Surge**, or **GitHub Gist + raw HTML**.
