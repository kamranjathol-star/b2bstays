'use strict';
/* =====================================================================
   /api/admin/requests   (admin session required for every method)
     GET                       list, newest first
     GET ?format=csv           download as CSV
     PATCH  ?id=BS-XXXX-XXXX   { status?, note? }   update the status / add a note
     DELETE ?id=BS-XXXX-XXXX   delete the record permanently
   ===================================================================== */
const http = require('../_lib/http');
const auth = require('../_lib/auth');
const store = require('../_lib/store');
const { text } = require('../_lib/validate');

const STATUSES = ['new', 'contacted', 'approved', 'rejected'];
const ID_RE = /^BS-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Stops spreadsheet programs from running a cell that starts with = + - @ as a formula. */
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function toCsv(items) {
  const head = ['Reference', 'Received (UTC)', 'Status', 'Company', 'Contact', 'Email', 'WhatsApp', 'Country', 'Trade licence / IATA', 'Services', 'Bookings per month', 'Consent given (UTC)', 'Notes'];
  const rows = items.map(function (r) {
    const d = r.data || {};
    return [r.id, r.receivedAt, r.status, d.company, d.contactName, d.email, d.whatsapp, d.country, d.tradeNumber,
      (d.services || []).join(' | '), d.monthlyVolume, d.consent && d.consent.at,
      (r.notes || []).map(function (n) { return n.at.slice(0, 10) + ': ' + n.text; }).join(' || ')];
  });
  return '﻿' + [head].concat(rows).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n') + '\r\n';
}

module.exports = async function handler(req, res) {
  try {
    if (['GET', 'PATCH', 'DELETE'].indexOf(req.method) === -1) return http.send(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET, PATCH, DELETE' });
    if (req.method === 'GET' ? !http.fetchSiteOk(req) : !http.originOk(req)) return http.send(res, 403, { error: 'forbidden' });
    if (!auth.ready()) return http.send(res, 503, { error: 'not_configured' });
    const session = await auth.readSession(req);
    if (!session) return http.send(res, 401, { error: 'unauthorized' });
    if (!store.available()) return http.send(res, 503, { error: 'storage_not_configured' });

    const q = http.query(req);

    if (req.method === 'GET') {
      const items = await store.listRequests(1000);
      if (q.format === 'csv') {
        res.statusCode = 200;
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="access-requests-' + new Date().toISOString().slice(0, 10) + '.csv"');
        res.end(toCsv(items));
        return;
      }
      return http.send(res, 200, { ok: true, items: items });
    }

    const id = String(q.id || '');
    if (!ID_RE.test(id)) return http.send(res, 400, { error: 'bad_id' });

    if (req.method === 'DELETE') {
      if (!(await store.getRequest(id))) return http.send(res, 404, { error: 'not_found' });
      await store.deleteRequest(id);
      console.log('[admin] deleted ' + id);
      return http.send(res, 200, { ok: true });
    }

    // PATCH
    if (!http.isJson(req)) return http.send(res, 415, { error: 'unsupported_media_type' });
    let body;
    try { body = await http.readJson(req); } catch (e) { return http.send(res, e.status || 400, { error: e.code || 'bad_request' }); }
    const rec = await store.getRequest(id);
    if (!rec) return http.send(res, 404, { error: 'not_found' });

    const now = new Date().toISOString();
    if (body.status !== undefined) {
      if (STATUSES.indexOf(body.status) === -1) return http.send(res, 422, { error: 'invalid_status' });
      if (body.status !== rec.status) {
        rec.history = (rec.history || []).concat([{ at: now, from: rec.status, to: body.status }]).slice(-50);
        rec.status = body.status;
      }
    }
    if (body.note !== undefined) {
      const note = text(body.note, 1000);
      if (note) rec.notes = (rec.notes || []).concat([{ at: now, text: note }]).slice(-100);
    }
    await store.saveRequest(rec);
    return http.send(res, 200, { ok: true, item: rec });
  } catch (e) {
    console.error('[admin/requests] error:', e && e.message);
    return http.send(res, 500, { error: 'server_error' });
  }
};
