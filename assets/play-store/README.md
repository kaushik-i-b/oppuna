# Play Store listing assets

## Phone screenshots

`screenshots/` contains **10** portrait PNGs at **1080×1920** with marketing taglines and branded UI mockups.

| Order | File | Tagline |
| --- | --- | --- |
| 1 | `screenshots/01-private-ai.png` | Private AI for your thoughts |
| 2 | `screenshots/02-fully-offline.png` | Works fully offline |
| 3 | `screenshots/03-ai-companion.png` | On-device AI companion |
| 4 | `screenshots/04-mood-tracker.png` | Track your mood privately |
| 5 | `screenshots/05-journal.png` | A journal only you can read |
| 6 | `screenshots/06-breathing.png` | Breathe your way back to calm |
| 7 | `screenshots/07-grounding.png` | Ground yourself in the moment |
| 8 | `screenshots/08-sleep.png` | Wind down without the noise |
| 9 | `screenshots/09-daily-plan.png` | A daily plan at your pace |
| 10 | `screenshots/10-no-tracking.png` | No accounts. No tracking. |

Full tagline + supporting copy: [`screenshots/TAGLINES.md`](screenshots/TAGLINES.md).

Regenerate:

```bash
python3 scripts/generate-play-store-screenshots.py
```

Requires Pillow (`pip install Pillow`).

Feature graphic: [`../feature-image.png`](../feature-image.png) (existing).
