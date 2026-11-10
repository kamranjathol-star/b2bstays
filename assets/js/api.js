/* =====================================================================
   Access-request API adapter — the ONLY file that talks to a backend.

   To go live:
     1. Build an HTTPS endpoint that accepts POST application/json (below).
     2. Put its URL in SITE.form.endpoint (assets/js/site-config.js).
     3. Keep every secret (email-service keys, CRM tokens, etc.) on that server.
        This file and the page are public — NEVER put an API key in them.

   Request body (JSON):
   {
     "company":       "Example Travel Ltd",
     "contactName":   "A. Person",
     "email":         "a.person@example.com",
     "whatsapp":      "+447700900000",        // international format
     "country":       "GB",                   // ISO 3166-1 alpha-2
     "tradeNumber":   "",                     // trade licence / IATA number, optional
     "services":      ["hotels","visa"],      // hotels visa transfers transport ziyarat train corporate
     "monthlyVolume": "10-50",                // unsure | lt10 | 10-50 | 51-200 | gt200
     "consent": { "accepted": true, "text": "…exact wording shown…", "version": "2026-11-10", "at": "ISO-8601" },
     "website":       "",                     // HONEYPOT: real people leave it empty -> reject if non-empty
     "meta": { "lang": "en", "page": "https://…/", "submittedAt": "ISO-8601", "elapsedMs": 41230 }
   }

   Server checklist: reject if `website` is non-empty; reject/flag if elapsedMs < 3000
   (bots); validate and length-limit every field again; rate-limit by IP; send CORS headers
   only for your own origin; store the consent object with the record.

   Response: 2xx with optional JSON { "reference": "REQ-1234" }.
             4xx/5xx = failure (optional JSON { "errors": { "email": "…" } }).
   ===================================================================== */
(function () {
  'use strict';
  var B2B = (window.B2B = window.B2B || {});

  function plainText(p) {
    var lines = [
      'Company: ' + p.company,
      'Contact name: ' + p.contactName,
      'Email: ' + p.email,
      'WhatsApp: ' + p.whatsapp,
      'Country: ' + p.country,
      'Trade licence / IATA: ' + (p.tradeNumber || '-'),
      'Services wanted: ' + p.services.join(', '),
      'Expected bookings per month: ' + p.monthlyVolume,
      '',
      'Consent given: ' + p.consent.at,
    ];
    return lines.join('\n');
  }

  /** @returns {Promise<{status:'sent'|'prepared'|'not-configured', reference?:string|null}>} */
  async function submitAccessRequest(payload) {
    var SITE = window.SITE || {};
    var cfg = SITE.form || {};

    if (cfg.endpoint) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, cfg.timeoutMs || 15000);
      try {
        var res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        var data = {};
        try { data = await res.json(); } catch (e) { /* empty body is fine */ }
        if (!res.ok) {
          var err = new Error('request-failed');
          err.status = res.status;
          err.fieldErrors = (data && data.errors) || null;
          throw err;
        }
        return { status: 'sent', reference: (data && data.reference) || null };
      } finally {
        clearTimeout(timer);
      }
    }

    var email = SITE.contact && SITE.contact.email;
    if (email) {
      // No backend yet: hand the request to the visitor's own email app. Nothing is sent
      // until they press Send, and the UI says so.
      var subject = 'Access request — ' + payload.company;
      window.location.href = 'mailto:' + encodeURIComponent(email) +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(plainText(payload));
      return { status: 'prepared' };
    }

    if (window.console) console.info('[Request form not connected] Payload that would be sent:', payload);
    return { status: 'not-configured' };
  }

  B2B.api = { submitAccessRequest: submitAccessRequest };
})();
