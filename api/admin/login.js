'use strict';
/* POST /api/admin/login   { email, password }  ->  sets the admin session cookie */
const http = require('../_lib/http');
const auth = require('../_lib/auth');
const store = require('../_lib/store');

const WINDOW = 900;               // 15 minutes
const MAX_FAILS_PER_IP = 10;
const MAX_FAILS_PER_EMAIL = 30;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return http.send(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!http.originOk(req)) return http.send(res, 403, { error: 'forbidden' });
    if (!http.isJson(req)) return http.send(res, 415, { error: 'unsupported_media_type' });
    if (!auth.ready()) return http.send(res, 503, { error: 'not_configured' });

    let body;
    try { body = await http.readJson(req); } catch (e) { return http.send(res, e.status || 400, { error: e.code || 'bad_request' }); }
    const email = String((body && body.email) || '').trim().toLowerCase().slice(0, 200);
    const password = String((body && body.password) || '').slice(0, 300);
    if (!email || !password) return http.send(res, 400, { error: 'missing_fields' });

    const ipKey = 'rl:login:ip:' + http.hashKey(http.clientIp(req));
    const mailKey = 'rl:login:em:' + http.hashKey(email);
    const [ipFails, mailFails] = await Promise.all([store.count(ipKey), store.count(mailKey)]);
    if (ipFails >= MAX_FAILS_PER_IP || mailFails >= MAX_FAILS_PER_EMAIL) {
      return http.send(res, 429, { error: 'too_many_attempts' }, { 'Retry-After': String(WINDOW) });
    }

    const ok = await auth.checkCredentials(email, password);
    if (!ok) {
      await Promise.all([store.hit(ipKey, WINDOW), store.hit(mailKey, WINDOW)]);
      await http.sleep(400);
      console.warn('[admin] failed sign-in');
      return http.send(res, 401, { error: 'invalid_credentials' });
    }

    const session = auth.issueSession();
    console.log('[admin] signed in');
    return http.send(res, 200, { ok: true, email: auth.adminEmail(), expiresAt: session.payload.exp * 1000 },
      { 'Set-Cookie': auth.sessionCookie(session.token, auth.SESSION_SECONDS) });
  } catch (e) {
    console.error('[admin/login] error:', e && e.message);
    return http.send(res, 500, { error: 'server_error' });
  }
};
