# Oppuna Feature Inventory (marketing website)

Inspected: mobile app source under the repo root (`src/`, `docs/`, `app.json`, `site/`) and the live Google Play listing.  
Only advertise **Confirmed** items below.

## Confirmed features (user-accessible)

| Feature | User experience |
|---------|-----------------|
| Daily wellness plan | Personalized offline plan, activities, progress |
| Home hub | Greeting, wellness score, streak, today’s plan, mood entry |
| Mood check-ins & history | Mood, intensity, notes, tags; weekly insights |
| Journal | Daily, gratitude, thought record, trigger, note |
| Supportive AI companion | On-device chat; guided offline fallback |
| Voice mode | Device TTS + local mic voice notes (no transcript upload) |
| Crisis safety | Pauses coaching; shows local helpline resources |
| Breathing / grounding / sleep | Via plan activities (breathing also from crisis) |
| App lock | Optional biometric / device PIN |
| Export / delete data | JSON export; permanent wipe |
| Offline architecture | No account; network guard; Android `INTERNET` blocked |

## Do not advertise

- Download counts / ratings / testimonials (not claimed here)
- Clinical validation, HIPAA/GDPR/ISO certifications
- Database encryption / speech-to-text
- Orphaned Self-Care hub screen
- Premium / IAP (disabled in code)

## Store & contact (verified from Play)

| Field | Value |
|-------|-------|
| Play URL | https://play.google.com/store/apps/details?id=com.oppuna.care |
| Package | `com.oppuna.care` |
| Developer | ADILAKSHMI INFOTECH PRIVATE LIMITED |
| Support email (Play) | admin@adilakshmi.co |
| Content rating (Play) | Everyone |

## Brand

- Name: Oppuna  
- Tagline: Private AI for your thoughts  
- Sage: `#3D6B5A`, `#2F5446`, `#DCE8E2`, `#F7F4EF`, `#FFFCF8`, `#1C2420`  
- Assets: `assets/icon.png`, `splash-icon.png`, `feature-image.png`  
- Phone screenshots: not in repo — site uses authentic splash mark in a phone frame  

## Crisis numbers on site (India, government sources)

- Emergency: 112  
- KIRAN: 1800-599-0019  
- Tele-MANAS: 14416  

## Placeholders remaining

- [ ] Canonical production domain (`siteUrl` in `src/config/site.ts`)  
- [ ] Optional social profiles  
- [ ] Legal review of web Privacy/Terms  
- [ ] Real phone UI screenshots when available  
