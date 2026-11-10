# B2B Stays — trade site

A static website (plain HTML, CSS and JavaScript — **no build step**) for a B2B travel-services business in Saudi Arabia.

| Page | File | Indexed by search engines? |
|---|---|---|
| Home (request-access form, services, FAQ, hours) | `index.html` | yes |
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
- [ ] Add your own or licensed photos (paths in `site-config.js` → `destinations`) — or keep the illustrated artwork.
- [ ] Check the wording of every claim against what you actually offer (services, "Haramain train", visa wording).
- [ ] When the portal exists, set `SITE.portal.loginUrl` — every "Agent login" link will point to it.

## Notes
- Fonts (Manrope, Fraunces, IBM Plex Sans Arabic — SIL Open Font License) are self-hosted in `assets/fonts/`; the site makes no third-party requests.
- `.claude/launch.json` is only a local preview helper for Claude Code; you can delete it.
