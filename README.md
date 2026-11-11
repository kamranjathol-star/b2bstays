# B2B Stays — trade site

Plain HTML, CSS and JavaScript (**no build step**) plus a few small server functions in `api/` (Vercel) that receive access requests and power the admin area.

| Page | File | Indexed by search engines? |
|---|---|---|
| Home (minimal: photo hero + request-access form + destination and hotel photos) | `index.html` | yes |
| Services (7 service cards with photos) | `services.html` | yes |
| How it works (4 steps, portal preview with sample data, proof strip) | `how-it-works.html` | yes |
| FAQ | `faq.html` | yes |
| Support (hours in Saudi + UK time) | `support.html` | yes |
| Agent accounts info ("Agent login" links) | `login.html` | **no** (`noindex`) |
| **Admin area** (team only: sign-in + access requests) | `admin.html` → `/admin` | **no** (`noindex`, no cache) |
| Privacy / Terms / Cookies | `privacy.html`, `terms.html`, `cookies.html` | yes |

## Edit your details — one file

`assets/js/site-config.js` holds every business fact: company number, registered office, VAT, licence, contact details, support hours, years trading, the form endpoint and photo paths.
**Anything left empty is simply not shown.** Never put API keys or passwords in it — it is public.

## Backend: access requests + admin area

What happens when an agent presses **Send request**:

1. the page posts the form to `/api/access-request` (`api/access-request.js`);
2. the server checks everything again (spam traps, field validation, rate limit per IP, double-send protection);
3. the request is **saved** (so the admin area can list it) and **emailed to registrations@b2bstays.com** (reply-to = the applicant, so you can just answer the email);
4. the agent sees "Request received" with a reference such as `BS-7K4Q-9M2X`.

The team then works in **https://b2bstays.com/admin**: sign in with `registrations@b2bstays.com`, see every request, mark it *New / Contacted / Approved / Rejected*, add notes, open WhatsApp or email in one click, export CSV, or delete a record for good (data-erasure requests).

If nothing is connected yet, the form honestly says online requests are unavailable instead of pretending to send.

### One-time set-up (about 10 minutes)

1. **Mailbox.** In Krystal cPanel → *Email Accounts*, make sure the mailbox `registrations@b2bstays.com` exists (note its password).
2. **Run the set-up script** in a terminal in this folder:

   ```bash
   node tools/setup-admin.mjs
   ```

   It asks for the admin email, a new admin password and the mailbox password (typed hidden), checks the mailbox login (and can send you a test email), stores only a *hash* of the admin password, and saves everything as write-only Vercel settings. At the end it offers to create the **storage** for you: a free *Upstash for Redis* database called `b2bstays-requests`, connected to the project (accept the terms, choose the Free plan and a European region). Run it again any time to change the password.

   Prefer clicking? Storage can also be added in the Vercel dashboard: project `b2bstays` → **Storage → Create Database → Upstash for Redis** → connect it to the project. Vercel then provides the `KV_REST_API_URL` / `KV_REST_API_TOKEN` settings itself.
3. **Redeploy** so the settings apply: `npx vercel deploy --prod`.
4. Open `/admin`, sign in, and send yourself a test request from the home page.

### Settings the functions read (Vercel → Project → Settings → Environment Variables)

| Name | What it is | Secret? |
|---|---|---|
| `ADMIN_EMAIL` | the admin account (`registrations@b2bstays.com`) | no |
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password (made by `tools/setup-admin.mjs`) | yes |
| `SESSION_SECRET` | random 32+ character string that signs the sign-in cookie | yes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` | the mailbox's mail server (`mail.b2bstays.com`, `465`, the mailbox login) | no |
| `SMTP_PASS` | the mailbox password | yes |
| `NOTIFY_EMAIL` | where "new request" emails go (default: `ADMIN_EMAIL`) | no |
| `MAIL_FROM` | optional sender, default `B2B Stays <SMTP_USER>` | no |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | added by the Upstash integration (`UPSTASH_REDIS_REST_*` also works) | yes |
| `ALLOWED_ORIGINS` | optional, comma-separated; default `https://b2bstays.com`, `https://www.b2bstays.com` | no |

### How the admin sign-in is protected

- The password is never stored, only a scrypt hash. Wrong attempts are slowed down and, after 10 from one address, blocked for 15 minutes.
- The sign-in cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, only sent to `/api/admin/*`, signed, and valid for 8 hours. Changing the admin password (or `SESSION_SECRET`) signs everyone out; *Sign out* also revokes the cookie on the server.
- Changes (status, notes, delete) require a matching `Origin`; the admin page runs under a strict Content-Security-Policy and shows request data as plain text only; CSV export neutralises spreadsheet formulas.
- Request details are personal data: they are kept in your Upstash database and your mailbox. Decide how long to keep them (the privacy policy has a placeholder) and delete old ones in `/admin`.
- Not included yet (good next steps): two-step verification for the admin, an automatic reply email to the applicant, per-agent logins.

### Test it on your own computer (nothing is sent anywhere)

```bash
npm install                     # once, in this folder (installs the email library)
node tools/test-api.mjs        # 40 automatic checks of the server functions
node tools/dev-server.mjs      # whole site + API on http://localhost:5174 (in-memory storage, fake mailbox)
```

The dev server prints a random admin password at start-up; `http://localhost:5174/__dev/seed` adds sample requests and `/__dev/mail` shows the emails that would have been sent.

## Preview the static pages only

```bash
python -m http.server 5173
```

(The form and `/admin` need the functions, so use `tools/dev-server.mjs` for those.)

## Publish

The site is deployed with the Vercel CLI from this folder:

```bash
npx vercel deploy --prod
```

`vercel.json` holds the security headers, the `/admin` rewrite and the function settings; `.vercelignore` keeps tooling, source photos and this README out of the deployment. The domain `b2bstays.com` points at the Vercel project.

## Before you go live — checklist

- [ ] Finish the **Backend set-up** above (mailbox, Upstash storage, `node tools/setup-admin.mjs`, redeploy).
- [ ] Fill in `assets/js/site-config.js` (company number, registered office, VAT, licence, email, WhatsApp). The privacy policy and footer need a contact address for data requests.
- [ ] **Confirm the support hours** in `site-config.js` (they are placeholders).
- [ ] Have a solicitor check `privacy.html`, `terms.html`, `cookies.html`, resolve the two highlighted `[…]` items (retention period, governing law), then set `legalPagesReviewed: true`.
- [ ] Have a **native Arabic speaker** review the Arabic in `assets/js/i18n.js` and `assets/js/i18n-extra.js`.
- [ ] Swap the stock photos for your own when you have them — see **Photos** below.
- [ ] Fill the **proof strip** in `site-config.js` (cities, hotels, accreditations, partner logos, up to 3 quotes) with real, permissioned facts. Each block stays hidden until filled. `yearsTrading` is already set.
- [ ] Replace the sample dashboard/voucher on "How it works" when a real portal exists (it is labelled as sample data; the QR on the sample voucher scans to "SAMPLE VOUCHER - PREVIEW ONLY - NOT VALID").
- [ ] Check the wording of every claim against what you actually offer (services, "Haramain train", visa wording).
- [ ] When agents get their own login, set `SITE.portal.loginUrl` — every "Agent login" link will point to it.

## Logo

The logo files in `assets/img/` (`logo-mark-*.png`, `logo-full-*.png`, `favicon-*.png`, `apple-touch-icon.png`) and `favicon.ico` were cut from the supplied artwork, which is kept in `images-src/brand/logo-original.jpg` (not deployed). Only the paper texture was lifted to white; the colours are untouched. The header shows the mark on a white tile; the footer and the admin sign-in show the full logo on white.

## Photos

Only use photos you own or have licensed. The photos currently on the site are free-licence stock from Pexels (generic famous places and hotels — not specific properties you sell); swap them for your own when you can. Slots: the **hero**, the **8 destination tiles** and **3 hotel tiles** on the home page, and the **7 service cards** on the Services page.

1. Put the originals in `images-src/`, named `hero.jpg`, `city-<name>.jpg` (any name, e.g. `city-paris.jpg`; add a matching `<li data-dest="paris">` in `index.html`), `hotel-<name>.jpg` (e.g. `hotel-pool.jpg`; add a `data-group="hotels"` tile) and `svc-hotels.jpg` (`hotels | visa | transfers | transport | ziyarat | train | corp`). A wide landscape works best for the hero.
2. Run `cd tools && npm install && node optimize-images.mjs`. It writes AVIF + WebP + JPEG at several widths to `assets/img/photos/`, keeps every hero file under 250 KB (cards under 140 KB), strips metadata, and prints the exact lines to paste.
3. Paste those lines into `assets/js/site-config.js` under `images`, and write the alt text in **English and Arabic**.

Photos are lazy-loaded (the hero loads first), responsive (`srcset`), and the hero sits under a dark-green overlay tuned so white text stays above WCAG AA contrast even over a white photo. If a photo fails to load, the slot falls back to a plain tile. To swap a photo, replace the file in `images-src/` and run the tool again.

## Notes
- Fonts (Manrope, Fraunces, IBM Plex Sans Arabic — SIL Open Font License) are self-hosted in `assets/fonts/`; the site makes no third-party requests.
- `.claude/launch.json` is only a local preview helper for Claude Code; you can delete it.
