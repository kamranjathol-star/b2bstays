# B2B Stays — trade site

A static website (plain HTML, CSS and JavaScript — **no build step**) for a B2B travel-services business in Saudi Arabia.

| Page | File | Indexed by search engines? |
|---|---|---|
| Home (minimal: photo hero + request-access form + destination and hotel photos) | `index.html` | yes |
| Services (7 service cards with photos) | `services.html` | yes |
| How it works (4 steps, portal preview with sample data, proof strip) | `how-it-works.html` | yes |
| FAQ | `faq.html` | yes |
| Support (hours in Saudi + UK time) | `support.html` | yes |
| Agent login ("portal opening soon") | `login.html` | **no** (`noindex`) |
| Privacy / Terms / Cookies | `privacy.html`, `terms.html`, `cookies.html` | yes |

## Edit your details — one file

`assets/js/site-config.js` holds every business fact: company number, registered office, VAT, licence, contact details, support hours, the form endpoint and photo paths.
**Anything left empty is simply not shown.** Never put API keys in it — it is public.

## Preview locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173 (opening the files by double-click also works for a quick look).

## Publish

### Option A — GitHub Pages (free, simplest)
1. Push this folder to your GitHub repository (files must be at the repository root).
2. Repository → **Settings → Pages → Build and deployment → Source: "Deploy from a branch"** → branch `main`, folder `/ (root)` → **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository>/`.
4. Custom domain: add it under **Settings → Pages → Custom domain**, create the DNS records GitHub shows, then tick **Enforce HTTPS**.

> GitHub Pages on a *private* repository needs a paid GitHub plan. Cloudflare Pages, Netlify and Vercel all have free tiers that deploy private repositories: import the repo, set *no build command* and the *output directory* to the repository root.

### Option B — Cloudflare Pages / Netlify / Vercel
Import the repository → framework "Other / static" → no build command → publish directory `.` → deploy. Add your domain in the host's dashboard.

## Before you go live — checklist

- [ ] Fill in `assets/js/site-config.js` (company number, registered office, VAT, licence, email, WhatsApp).
- [ ] **Confirm the support hours** in `site-config.js` (they are placeholders).
- [ ] Build the form backend and set `SITE.form.endpoint` (payload and server checklist are in `assets/js/api.js`). Until then the form says it is not connected, or opens the visitor's email app if `contact.email` is set.
- [ ] Have a solicitor check `privacy.html`, `terms.html`, `cookies.html`, resolve the two highlighted `[…]` items (retention period, governing law), then set `legalPagesReviewed: true`.
- [ ] Have a **native Arabic speaker** review the Arabic in `assets/js/i18n.js` (the `AR` object).
- [ ] Add your own or licensed photos (hero, service cards, city cards) — see **Photos** below. Without them the illustrated artwork stays.
- [ ] Fill the **proof strip** in `site-config.js` (years trading, cities, hotels, accreditations, partner logos, up to 3 quotes) with real, permissioned facts. Each block stays hidden until filled.
- [ ] Replace the sample dashboard/voucher in the "See the portal" section when the real portal exists (it is clearly labelled as sample data; the QR on the sample voucher scans to "SAMPLE VOUCHER - PREVIEW ONLY - NOT VALID").
- [ ] Check the wording of every claim against what you actually offer (services, "Haramain train", visa wording).
- [ ] When the portal exists, set `SITE.portal.loginUrl` — every "Agent login" link will point to it.

## Photos

Only use photos you own or have licensed. The photos currently on the site are free-licence stock from Pexels (generic famous places and hotels — not specific properties you sell); swap them for your own when you can. Slots: the **hero**, the **8 destination tiles** and **3 hotel tiles** on the home page, and the **7 service cards** on the Services page.

1. Put the originals in `images-src/`, named `hero.jpg`, `city-<name>.jpg` (any name, e.g. `city-paris.jpg`; add a matching `<li data-dest="paris">` in `index.html`), `hotel-<name>.jpg` (e.g. `hotel-pool.jpg`; add a `data-group="hotels"` tile) and `svc-hotels.jpg` (`hotels | visa | transfers | transport | ziyarat | train | corp`). A wide landscape works best for the hero.
2. Run `cd tools && npm install && node optimize-images.mjs`. It writes AVIF + WebP + JPEG at several widths to `assets/img/photos/`, keeps every hero file under 250 KB (cards under 140 KB), strips metadata, and prints the exact lines to paste.
3. Paste those lines into `assets/js/site-config.js` under `images`, and write the alt text in **English and Arabic**.

Photos are lazy-loaded (the hero loads first), responsive (`srcset`), and the hero sits under a dark-green overlay tuned so white text stays above WCAG AA contrast even over a white photo. If a photo fails to load, the slot falls back to the illustration. To swap a photo, replace the file in `images-src/` and run the tool again.

## Notes
- Fonts (Manrope, Fraunces, IBM Plex Sans Arabic — SIL Open Font License) are self-hosted in `assets/fonts/`; the site makes no third-party requests.
- `.claude/launch.json` is only a local preview helper for Claude Code; you can delete it.
