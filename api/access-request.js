'use strict';
/* =====================================================================
   POST /api/access-request   — the "Request access" form on the home page.

   What happens to a request
     1. checks the origin, size and content type; honeypot + speed trap -> silently ignored
     2. validates every field again (the page's checks are not trusted)
     3. rate-limits by IP and ignores an immediate duplicate
     4. saves it (admin area) and emails registrations@b2bstays.com
   Responds 200 { ok:true, reference } only when at least one of those two worked.
   Responds 503 { error:'not_configured' } when neither storage nor email is set up yet.
   ===================================================================== */
const crypto = require('crypto');
const http = require('./_lib/http');
const store = require('./_lib/store');
const mail = require('./_lib/mail');
const { validateAccessRequest } = require('./_lib/validate');

const MIN_FILL_MS = 2000;          // faster than this = a bot
const IP_PER_HOUR = 6;
const IP_PER_DAY = 20;

const SERVICE_LABEL = { hotels: 'Hotels', visa: 'Visa services', transfers: 'Transfers', transport: 'Transportation', ziyarat: 'Ziyarat & sightseeing', train: 'Haramain train', corporate: 'Corporate tours' };
const VOLUME_LABEL = { unsure: 'Not sure yet', lt10: 'Fewer than 10', '10-50': '10-50', '51-200': '51-200', gt200: 'More than 200' };

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no I, L, O, 0, 1
function newReference() {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return 'BS-' + s.slice(0, 4) + '-' + s.slice(4);
}

function countryName(code) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch (e) { return code; }
}

function emailText(rec) {
  const d = rec.data;
  const lines = [
    'New access request ' + rec.id,
    'Received: ' + rec.receivedAt,
    '',
    'Company:               ' + d.company,
    'Contact:               ' + d.contactName,
    'Email:                 ' + d.email,
    'WhatsApp:              ' + d.whatsapp + '   (https://wa.me/' + d.whatsapp.replace(/\D/g, '') + ')',
    'Country:               ' + countryName(d.country) + ' (' + d.country + ')',
    'Trade licence / IATA:  ' + (d.tradeNumber || '-'),
    'Services wanted:       ' + d.services.map(function (s) { return SERVICE_LABEL[s] || s; }).join(', '),
    'Bookings per month:    ' + (VOLUME_LABEL[d.monthlyVolume] || d.monthlyVolume),
    'Form language:         ' + (d.lang === 'ar' ? 'Arabic' : 'English'),
    '',
    'Consent: ' + (d.consent.at || rec.receivedAt) + (d.consent.version ? ' (privacy policy version ' + d.consent.version + ')' : ''),
    '',
    store.available() ? 'Review and update it in the admin area: https://b2bstays.com/admin' : '',
    'Reply to this email to answer the applicant directly.'
  ];
  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return http.send(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!http.originOk(req)) return http.send(res, 403, { error: 'forbidden' });
    if (!http.isJson(req)) return http.send(res, 415, { error: 'unsupported_media_type' });
    if (!store.available() && !mail.enabled()) return http.send(res, 503, { error: 'not_configured' });

    let body;
    try { body = await http.readJson(req); } catch (e) { return http.send(res, e.status || 400, { error: e.code || 'bad_request' }); }

    // Spam traps: look successful, store and send nothing.
    const elapsed = body && body.meta ? Number(body.meta.elapsedMs) : NaN;
    if ((body && typeof body.website === 'string' && body.website.trim() !== '') || (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS)) {
      console.warn('[access-request] spam trap');
      return http.send(res, 200, { ok: true });
    }

    const v = validateAccessRequest(body);
    if (!v.ok) return http.send(res, 422, { error: 'invalid', errors: v.errors });

    // Rate limit (per IP): a few requests an hour, a handful a day.
    const ip = http.hashKey(http.clientIp(req));
    const perHour = await store.hit('rl:req:h:' + ip, 3600);
    const perDay = await store.hit('rl:req:d:' + ip, 86400);
    if (perHour > IP_PER_HOUR || perDay > IP_PER_DAY) return http.send(res, 429, { error: 'rate_limited' }, { 'Retry-After': '3600' });

    // Same person pressing Send twice: accept, but keep a single record.
    const dupKey = 'dup:' + crypto.createHash('sha256').update(v.data.email + '|' + v.data.company.toLowerCase()).digest('hex').slice(0, 32);
    if (!(await store.once(dupKey, 900))) return http.send(res, 200, { ok: true });

    const rec = { id: newReference(), receivedAt: new Date().toISOString(), status: 'new', data: v.data, notes: [], notified: false };

    let saved = false;
    if (store.available()) {
      try { await store.createRequest(rec); saved = true; } catch (e) { console.error('[access-request] save failed:', e && e.message); }
    }

    const sent = await mail.send({
      subject: 'New access request ' + rec.id + ' - ' + v.data.company,
      text: emailText(rec),
      replyTo: v.data.email
    });
    rec.notified = !!sent.sent;
    if (saved && rec.notified) { try { await store.saveRequest(rec); } catch (e) { /* the record already exists; the flag is cosmetic */ } }

    if (!saved && !sent.sent) return http.send(res, 500, { error: 'unavailable' });
    console.log('[access-request] stored=' + saved + ' emailed=' + !!sent.sent + ' ref=' + rec.id);
    return http.send(res, 200, { ok: true, reference: rec.id });
  } catch (e) {
    console.error('[access-request] error:', e && e.message);
    return http.send(res, 500, { error: 'server_error' });
  }
};
