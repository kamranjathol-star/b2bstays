'use strict';
/* GET /api/admin/session  ->  who is signed in, and which parts of the back end are connected */
const http = require('../_lib/http');
const auth = require('../_lib/auth');
const store = require('../_lib/store');
const mail = require('../_lib/mail');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return http.send(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
    if (!http.fetchSiteOk(req)) return http.send(res, 403, { error: 'forbidden' });
    if (!auth.ready()) return http.send(res, 503, { error: 'not_configured' });
    const session = await auth.readSession(req);
    if (!session) return http.send(res, 401, { error: 'unauthorized' });
    return http.send(res, 200, {
      ok: true,
      email: session.e,
      expiresAt: session.exp * 1000,
      storage: store.available(),
      mail: mail.enabled(),
      notifyTo: mail.notifyAddress()
    });
  } catch (e) {
    console.error('[admin/session] error:', e && e.message);
    return http.send(res, 500, { error: 'server_error' });
  }
};
