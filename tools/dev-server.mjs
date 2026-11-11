#!/usr/bin/env node
/* =====================================================================
   Local preview of the whole site INCLUDING the /api functions:
       node tools/dev-server.mjs            (then open http://localhost:5174)

   Everything runs in memory on your computer: requests are stored in memory and
   "emails" are kept in a list instead of being sent. Nothing leaves your machine.

   Admin sign-in for local testing
       DEV_ADMIN_PASSWORD=your-test-password node tools/dev-server.mjs
   (if you do not set it, a random password is generated and printed once).
   http://localhost:5174/__dev/seed  adds three sample requests,
   http://localhost:5174/__dev/mail  shows the emails that would have been sent.
   ===================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.env.PORT || '5174', 10);

process.env.B2B_DEV = '1';
process.env.B2B_DEV_STORE = process.env.B2B_DEV_STORE || 'memory';
process.env.B2B_DEV_MAIL = process.env.B2B_DEV_MAIL || 'log';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'registrations@b2bstays.com';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const auth = require('../api/_lib/auth.js');
const store = require('../api/_lib/store.js');

let password = process.env.DEV_ADMIN_PASSWORD;
let generated = false;
if (!password) { password = crypto.randomBytes(12).toString('base64url'); generated = true; }
process.env.ADMIN_PASSWORD_HASH = await auth.hashPassword(password);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const file = path.resolve(root, '.' + rel);
  // only files inside the project, and never tooling / secrets / sources
  if (!file.startsWith(root + path.sep) || /[\\/](node_modules|tools|images-src|\.git|\.claude|\.vercel)([\\/]|$)/.test(file) || /[\\/]package(-lock)?\.json$/.test(file)) { res.statusCode = 404; res.end('Not found'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain'); res.end('Not found'); return; }
    res.statusCode = 200;
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    if (/admin\.html$/.test(file)) {      // same headers as vercel.json, so CSP problems show up locally
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    }
    fs.createReadStream(file).pipe(res);
  });
}

async function seed() {
  const mk = (i, over) => Object.assign({
    id: 'BS-' + 'DEV' + i + '-TEST', receivedAt: new Date(Date.now() - i * 3600e3 * 7).toISOString(), status: 'new', notified: true, notes: [],
    data: { company: 'Sample Travel ' + i + ' Ltd', contactName: 'Sample Person ' + i, email: 'sample' + i + '@example.com', whatsapp: '+4477009000' + i + '0', country: ['GB', 'PK', 'AE'][i % 3], tradeNumber: i === 1 ? 'IATA 12-3 4567 8' : '', services: ['hotels', 'visa', 'transfers'].slice(0, 1 + (i % 3)), monthlyVolume: ['10-50', 'lt10', '51-200'][i % 3], consent: { accepted: true, text: 'I agree that you may use these details…', version: '2026-11-10', at: new Date().toISOString() }, lang: i === 2 ? 'ar' : 'en' }
  }, over || {});
  for (const rec of [mk(1), mk(2, { status: 'contacted', data: { company: 'شركة الأمل للسفر', contactName: 'أحمد', email: 'ahmad@example.com', whatsapp: '+966500000000', country: 'SA', tradeNumber: '', services: ['hotels', 'ziyarat'], monthlyVolume: 'gt200', consent: { accepted: true, text: 'أوافق…', version: '2026-11-10', at: new Date().toISOString() }, lang: 'ar' } }), mk(3, { status: 'approved' })]) {
    try { await store.createRequest(rec); } catch (e) { /* already seeded */ }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__dev/mail') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(globalThis.__b2bMail || [], null, 2)); return; }
    if (url.pathname === '/__dev/seed') { await seed(); res.setHeader('Content-Type', 'text/plain'); res.end('seeded'); return; }
    if (url.pathname.startsWith('/api/')) {
      const rel = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
      const file = path.join(root, 'api', rel + '.js');
      if (!/^[a-z0-9/-]+$/i.test(rel) || rel.startsWith('_') || rel.includes('/_') || !fs.existsSync(file)) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); res.end('{"error":"not_found"}'); return; }
      await require(file)(req, res);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (e) {
    console.error(e);
    res.statusCode = 500; res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log('\nB2B Stays dev server  http://localhost:' + PORT);
  console.log('  admin page:      http://localhost:' + PORT + '/admin');
  console.log('  admin e-mail:    ' + process.env.ADMIN_EMAIL);
  console.log('  admin password:  ' + (generated ? password + '   (random, printed once)' : '(from DEV_ADMIN_PASSWORD)'));
  console.log('  sample data:     http://localhost:' + PORT + '/__dev/seed');
  console.log('  fake mailbox:    http://localhost:' + PORT + '/__dev/mail\n');
});
