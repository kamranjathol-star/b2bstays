'use strict';
/* POST /api/admin/logout  ->  clears the cookie and revokes the session on the server */
const http = require('../_lib/http');
const auth = require('../_lib/auth');
const store = require('../_lib/store');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return http.send(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!http.originOk(req)) return http.send(res, 403, { error: 'forbidden' });
    const session = await auth.readSession(req);
    if (session) {
      const left = session.exp - Math.floor(Date.now() / 1000);
      try { await store.revoke(session.j, left); } catch (e) { /* the cookie is still cleared below */ }
    }
    return http.send(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie('', 0) });
  } catch (e) {
    console.error('[admin/logout] error:', e && e.message);
    return http.send(res, 500, { error: 'server_error' });
  }
};
