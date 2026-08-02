# Oppuna investor pitch deck

Hosted route (GitHub Pages / custom domain):

**https://oppuna.com/investor/**

| File | Purpose |
|------|---------|
| `Oppuna-Investor-Pitch-Deck.pptx` | Editable PowerPoint (16:9, 14 + 3 appendix) |
| `Oppuna-Investor-Pitch-Deck.pdf` | PDF export |
| `index.html` | Download + embedded PDF viewer |
| `build_deck.py` | Regenerates the PPTX from brand assets |
| `PLACEHOLDERS.md` | Unresolved fundraising / co-founder fields |

Regenerate:

```bash
cd site/investor
python3 build_deck.py
libreoffice --headless --convert-to pdf Oppuna-Investor-Pitch-Deck.pptx
```

This folder is copied to the Pages root as `/investor/` during deploy. It does not modify the Next.js marketing website under `website/`.
