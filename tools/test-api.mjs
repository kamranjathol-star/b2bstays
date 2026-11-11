#!/usr/bin/env node
/* =====================================================================
   Tests for the /api functions (no network, no accounts needed):
       node tools/test-api.mjs
   Runs every handler against in-memory storage and a fake mailbox, and checks
   validation, spam traps, rate limits, sign-in, cookies, CSRF checks, the admin
   actions and the CSV export. Exits with code 1 if anything fails.
   ===================================================================== */
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const auth = require('../api/_lib/auth.js');
const store = require('../api/_lib/store.js');
const validate = require('../api/_lib/validate.js');
const intake = require('../api/access-request.js');
const login = require('../api/admin/login.js');
const logout = require('../api/admin/logout.js');
const session = require('../api/admin/session.js');
const requests = require('../api/admin/requests.js');

/* ---------- tiny test runner ---------- */
let passed = 0, failed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; failures.push(name); console.log('  FAIL ' + name + '\n       ' + (e && e.message)); }
}
function eq(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error((label || 'value') + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
function ok(cond, label) { if (!cond) throw new Error(label || 'assertion failed'); }

/* ---------- fake request / response ---------- */
const ORIGIN = 'https://b2bstays.com';
function makeReq(o) {
  o = o || {};
  const headers = Object.assign({}, o.headers);
  Object.keys(headers).forEach(function (k) { headers[k.toLowerCase()] = headers[k]; });
  const req = o.stream ? Readable.from([Buffer.from(o.stream)]) : new Readable({ read() { this.push(null); } });
  req.method = o.method || 'GET';
  req.url = o.url || '/';
  req.headers = headers;
  if (o.body !== undefined) req.body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body);
  return req;
}
function makeRes() {
  const res = { statusCode: 200, headers: {}, body: '', ended: false };
  res.setHeader = function (k, v) { res.headers[k.toLowerCase()] = v; };
  res.end = function (d) { res.body = d ? String(d) : ''; res.ended = true; };
  Object.defineProperty(res, 'json', { get: function () { try { return JSON.parse(res.body); } catch (e) { return null; } } });
  return res;
}
async function call(handler, o) {
  const res = makeRes();
  await handler(makeReq(o), res);
  return res;
}
const post = function (handler, body, extra) {
  return call(handler, Object.assign({ method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: body }, extra));
};

function goodPayload(over) {
  const p = {
    company: 'Example Travel Ltd', contactName: 'A. Person', email: 'a.person@example.com', whatsapp: '+447700900000', country: 'GB',
    tradeNumber: '', services: ['hotels', 'visa'], monthlyVolume: '10-50',
    consent: { accepted: true, text: 'I agree that you may use these details…', version: '2026-11-10', at: new Date().toISOString() },
    website: '', meta: { lang: 'en', page: 'https://b2bstays.com/', submittedAt: new Date().toISOString(), elapsedMs: 41230 }
  };
  return Object.assign(p, over || {});
}

/* ---------- environment for the tests ---------- */
const TEST_PASSWORD = crypto.randomBytes(15).toString('base64url');
function resetEnv() {
  process.env.B2B_DEV_STORE = 'memory';
  process.env.B2B_DEV_MAIL = 'log';
  delete process.env.B2B_DEV;                      // so cookies get the Secure flag, like production
  process.env.ADMIN_EMAIL = 'registrations@b2bstays.com';
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASS; delete process.env.SMTP_PORT;
  store._memory().reset();
  globalThis.__b2bMail = [];
  globalThis.__b2bHits = new Map();
}
const mailbox = function () { return globalThis.__b2bMail || []; };
const stored = async function () { return store.listRequests(1000); };

async function signIn() {
  const res = await post(login, { email: 'registrations@b2bstays.com', password: TEST_PASSWORD });
  eq(res.statusCode, 200, 'sign-in status');
  return String(res.headers['set-cookie']).split(';')[0];
}
const authed = function (cookie, extra) { return Object.assign({ headers: { cookie: cookie, origin: ORIGIN, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' } }, extra); };

(async function main() {
  process.env.ADMIN_PASSWORD_HASH = await auth.hashPassword(TEST_PASSWORD);
  const hashA = process.env.ADMIN_PASSWORD_HASH;

  console.log('\nPassword hashing');
  await test('hash has the scrypt format and verifies', async function () {
    ok(/^scrypt\$16384\$8\$5\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(hashA), 'format');
    eq(await auth.verifyPassword(TEST_PASSWORD, hashA), true, 'right password');
    eq(await auth.verifyPassword(TEST_PASSWORD + 'x', hashA), false, 'wrong password');
  });
  await test('a broken stored hash never verifies and never throws', async function () {
    eq(await auth.verifyPassword('anything', ''), false);
    eq(await auth.verifyPassword('anything', 'not-a-hash'), false);
    eq(await auth.verifyPassword('anything', 'scrypt$1$1$1$AA==$AA=='), false);
  });

  console.log('\nValidation');
  await test('server country list matches the page\'s list', function () {
    const appJs = readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
    const m = /var ISO = \(([\s\S]*?)\)\.split\(' '\);/.exec(appJs);
    const client = new Set(Function('return (' + m[1] + ')')().split(' ').filter(Boolean));
    const src = readFileSync(path.join(root, 'api/_lib/validate.js'), 'utf8');
    const m2 = /new Set\(\(([\s\S]*?)\)\.split\(' '\)\)/.exec(src);
    const server = new Set(Function('return (' + m2[1] + ')')().split(' ').filter(Boolean));
    eq(client.size > 200, true, 'client list parsed');
    const missing = Array.from(client).filter(function (c) { return !server.has(c); });
    eq(missing, [], 'codes the page offers but the server rejects');
  });
  await test('service and volume values match the form', function () {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    const svc = Array.from(html.matchAll(/name="services" value="([a-z]+)"/g)).map(function (m) { return m[1]; });
    eq(svc, validate.SERVICES, 'services');
    const vol = Array.from(html.matchAll(/<option value="([^"]+)" data-i18n="vol\./g)).map(function (m) { return m[1]; });
    eq(vol, validate.VOLUMES, 'volumes');
  });

  console.log('\nAccess request: request checks');
  resetEnv();
  await test('only POST is accepted', async function () {
    const r = await call(intake, { method: 'GET', headers: { origin: ORIGIN } });
    eq(r.statusCode, 405); eq(r.headers.allow, 'POST');
  });
  await test('a request with no Origin, or a foreign Origin, is refused', async function () {
    eq((await call(intake, { method: 'POST', headers: { 'content-type': 'application/json' }, body: goodPayload() })).statusCode, 403, 'no origin');
    eq((await call(intake, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: goodPayload() })).statusCode, 403, 'foreign origin');
    eq((await call(intake, { method: 'POST', headers: { origin: 'https://b2bstays.com.evil.example', 'content-type': 'application/json' }, body: goodPayload() })).statusCode, 403, 'look-alike origin');
  });
  await test('both b2bstays.com and www.b2bstays.com are accepted', async function () {
    resetEnv();
    eq((await post(intake, goodPayload(), { headers: { origin: 'https://www.b2bstays.com', 'content-type': 'application/json' } })).statusCode, 200);
  });
  await test('non-JSON content type is refused', async function () {
    const r = await call(intake, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'text/plain' }, body: 'x' });
    eq(r.statusCode, 415);
  });
  await test('broken JSON gives 400', async function () {
    const r = await post(intake, '{not json');
    eq(r.statusCode, 400); eq(r.json.error, 'bad_json');
  });
  await test('an oversized body gives 413 (declared and streamed)', async function () {
    const big = JSON.stringify(goodPayload({ company: 'x'.repeat(40000) }));
    eq((await call(intake, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', 'content-length': String(big.length) }, stream: big })).statusCode, 413, 'declared');
    eq((await call(intake, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, stream: big })).statusCode, 413, 'streamed');
  });
  await test('with no storage and no email configured the answer is 503 not_configured', async function () {
    delete process.env.B2B_DEV_STORE; delete process.env.B2B_DEV_MAIL;
    delete process.env.KV_REST_API_URL; delete process.env.UPSTASH_REDIS_REST_URL;
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 503); eq(r.json.error, 'not_configured');
    resetEnv();
  });

  console.log('\nAccess request: spam traps and validation');
  resetEnv();
  await test('filled honeypot looks successful but stores and sends nothing', async function () {
    const r = await post(intake, goodPayload({ website: 'http://spam.example' }));
    eq(r.statusCode, 200); eq((await stored()).length, 0, 'stored'); eq(mailbox().length, 0, 'mail');
  });
  await test('a form filled in under 2 seconds is dropped quietly', async function () {
    const r = await post(intake, goodPayload({ meta: { lang: 'en', elapsedMs: 800 } }));
    eq(r.statusCode, 200); eq((await stored()).length, 0); eq(mailbox().length, 0);
  });
  await test('invalid fields give 422 with the field names', async function () {
    const r = await post(intake, goodPayload({ company: '', email: 'nope', whatsapp: '12', country: 'ZZ', services: [], monthlyVolume: 'lots', consent: { accepted: false } }));
    eq(r.statusCode, 422);
    eq(Object.keys(r.json.errors).sort(), ['company', 'consent', 'country', 'email', 'monthlyVolume', 'services', 'whatsapp']);
    eq((await stored()).length, 0);
  });
  await test('unknown service names are dropped, not trusted', async function () {
    resetEnv();
    const r = await post(intake, goodPayload({ services: ['hotels', 'rm -rf', 'hotels'] }));
    eq(r.statusCode, 200);
    eq((await stored())[0].data.services, ['hotels']);
  });

  console.log('\nAccess request: a good request');
  resetEnv();
  let firstRef;
  await test('is saved, emailed to registrations@b2bstays.com and answered with a reference', async function () {
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 200);
    ok(/^BS-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/.test(r.json.reference), 'reference format: ' + r.json.reference);
    firstRef = r.json.reference;
    const list = await stored();
    eq(list.length, 1, 'stored'); eq(list[0].id, firstRef); eq(list[0].status, 'new'); eq(list[0].notified, true, 'notified flag');
    eq(list[0].data.consent.version, '2026-11-10');
    const m = mailbox();
    eq(m.length, 1, 'mail count'); eq(m[0].to, 'registrations@b2bstays.com'); eq(m[0].replyTo, 'a.person@example.com');
    ok(m[0].subject.indexOf(firstRef) !== -1 && m[0].subject.indexOf('Example Travel Ltd') !== -1, 'subject: ' + m[0].subject);
    ok(m[0].text.indexOf('https://wa.me/447700900000') !== -1, 'whatsapp link in the email');
    ok(m[0].text.indexOf('United Kingdom') !== -1, 'country name in the email');
  });
  await test('pressing Send twice keeps a single record', async function () {
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 200); eq((await stored()).length, 1); eq(mailbox().length, 1);
  });
  await test('line breaks in a field cannot inject email headers', async function () {
    resetEnv();
    const r = await post(intake, goodPayload({ company: 'Evil Ltd\r\nBcc: victim@example.com', contactName: 'Eve\nSubject: hi' }));
    eq(r.statusCode, 200);
    const m = mailbox()[0];
    ok(!/[\r\n]/.test(m.subject), 'subject is one line: ' + JSON.stringify(m.subject));
    eq((await stored())[0].data.company, 'Evil Ltd Bcc: victim@example.com');
  });
  await test('Arabic text is kept intact', async function () {
    resetEnv();
    const r = await post(intake, goodPayload({ company: 'شركة الأمل للسفر', contactName: 'أحمد', meta: { lang: 'ar', elapsedMs: 9000 } }));
    eq(r.statusCode, 200);
    const rec = (await stored())[0];
    eq(rec.data.company, 'شركة الأمل للسفر'); eq(rec.data.lang, 'ar');
    ok(mailbox()[0].text.indexOf('Arabic') !== -1, 'language shown in the email');
  });
  await test('the 7th request from one address within an hour is refused (429)', async function () {
    resetEnv();
    const codes = [];
    for (let i = 0; i < 7; i++) codes.push((await post(intake, goodPayload({ email: 'p' + i + '@example.com' }), { headers: { origin: ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' } })).statusCode);
    eq(codes, [200, 200, 200, 200, 200, 200, 429]);
  });
  await test('storage only (email not set up) still succeeds', async function () {
    resetEnv(); delete process.env.B2B_DEV_MAIL;
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 200); eq((await stored()).length, 1); resetEnv();
  });
  await test('email only (storage not set up) still succeeds', async function () {
    resetEnv(); delete process.env.B2B_DEV_STORE;
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 200); eq(mailbox().length, 1); eq(r.json.reference !== undefined, true); resetEnv();
  });
  await test('a failing mail server never loses the request', async function () {
    resetEnv(); delete process.env.B2B_DEV_MAIL;
    process.env.SMTP_HOST = '127.0.0.1'; process.env.SMTP_PORT = '1'; process.env.SMTP_USER = 'u@example.com'; process.env.SMTP_PASS = 'x';
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 200, 'still accepted because it was saved');
    const rec = (await stored())[0];
    eq(rec.notified, false, 'flagged as not emailed');
    resetEnv();
  });
  await test('failing mail server and no storage = an honest error, not a fake success', async function () {
    resetEnv(); delete process.env.B2B_DEV_MAIL; delete process.env.B2B_DEV_STORE;
    process.env.SMTP_HOST = '127.0.0.1'; process.env.SMTP_PORT = '1'; process.env.SMTP_USER = 'u@example.com'; process.env.SMTP_PASS = 'x';
    const r = await post(intake, goodPayload());
    eq(r.statusCode, 500); resetEnv();
  });

  console.log('\nAdmin sign-in');
  resetEnv();
  await test('answers 503 until the admin password is set up', async function () {
    const keep = process.env.ADMIN_PASSWORD_HASH; delete process.env.ADMIN_PASSWORD_HASH;
    eq((await post(login, { email: 'registrations@b2bstays.com', password: TEST_PASSWORD })).statusCode, 503);
    process.env.ADMIN_PASSWORD_HASH = keep;
  });
  await test('a wrong password, a wrong e-mail and missing fields are all refused', async function () {
    const t0 = Date.now();
    eq((await post(login, { email: 'registrations@b2bstays.com', password: 'wrong' })).statusCode, 401, 'wrong password');
    ok(Date.now() - t0 >= 350, 'failures are slowed down');
    eq((await post(login, { email: 'someone@else.com', password: TEST_PASSWORD })).statusCode, 401, 'wrong email');
    eq((await post(login, { email: 'registrations@b2bstays.com' })).statusCode, 400, 'missing password');
  });
  await test('login from a foreign origin or with a non-JSON body is refused', async function () {
    eq((await call(login, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: { email: 'registrations@b2bstays.com', password: TEST_PASSWORD } })).statusCode, 403);
    eq((await call(login, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/x-www-form-urlencoded' }, body: 'a=b' })).statusCode, 415);
  });
  let cookie;
  await test('the right e-mail (any letter case) and password sign in; the cookie is locked down', async function () {
    const r = await post(login, { email: ' Registrations@B2BStays.com ', password: TEST_PASSWORD });
    eq(r.statusCode, 200); eq(r.json.email, 'registrations@b2bstays.com');
    const sc = String(r.headers['set-cookie']);
    ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/api/admin', 'Max-Age=28800'].forEach(function (f) { ok(sc.indexOf(f) !== -1, 'cookie has ' + f + ' :: ' + sc.replace(/=.*?;/, '=…;')); });
    ok(sc.indexOf('Domain=') === -1, 'no Domain attribute');
    cookie = sc.split(';')[0];
    ok(!JSON.stringify(r.json).includes(TEST_PASSWORD), 'password never echoed');
  });
  await test('the session endpoint reports who is signed in', async function () {
    const r = await call(session, authed(cookie));
    eq(r.statusCode, 200); eq(r.json.email, 'registrations@b2bstays.com'); eq(r.json.storage, true); eq(r.json.mail, true); eq(r.json.notifyTo, 'registrations@b2bstays.com');
  });
  await test('no cookie, a tampered cookie, an expired cookie and a cookie from before a password change are rejected', async function () {
    eq((await call(session, { headers: {} })).statusCode, 401, 'no cookie');
    const val = cookie.split('=').slice(1).join('=');
    const [body, sig] = [val.slice(0, val.lastIndexOf('.')), val.slice(val.lastIndexOf('.') + 1)];
    eq((await call(session, { headers: { cookie: 'bs_admin=' + body + '.' + sig.slice(0, -2) + 'AA' } })).statusCode, 401, 'bad signature');
    const forged = Buffer.from(JSON.stringify(Object.assign(JSON.parse(Buffer.from(body.slice(3), 'base64url')), { exp: 4102444800 }))).toString('base64url');
    eq((await call(session, { headers: { cookie: 'bs_admin=v1.' + forged + '.' + sig } })).statusCode, 401, 'edited payload');
    const past = 'v1.' + Buffer.from(JSON.stringify({ e: 'registrations@b2bstays.com', iat: 1, exp: 2, j: 'x', pv: 'x' })).toString('base64url');
    const goodSig = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(past).digest('base64url');
    eq((await call(session, { headers: { cookie: 'bs_admin=' + past + '.' + goodSig } })).statusCode, 401, 'expired');
    const keep = process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH = await auth.hashPassword('a different password 12345');
    eq((await call(session, authed(cookie))).statusCode, 401, 'after password change');
    process.env.ADMIN_PASSWORD_HASH = keep;
    eq((await call(session, authed(cookie))).statusCode, 200, 'valid again once restored');
  });
  await test('after 10 wrong passwords from one address, even the right password is refused for a while (429)', async function () {
    resetEnv();
    const h = { origin: ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.7' };
    let last;
    for (let i = 0; i < 10; i++) last = await call(login, { method: 'POST', headers: h, body: { email: 'registrations@b2bstays.com', password: 'bad' + i } });
    eq(last.statusCode, 401);
    const blocked = await call(login, { method: 'POST', headers: h, body: { email: 'registrations@b2bstays.com', password: TEST_PASSWORD } });
    eq(blocked.statusCode, 429); ok(!!blocked.headers['retry-after'], 'Retry-After header');
    const other = await call(login, { method: 'POST', headers: Object.assign({}, h, { 'x-forwarded-for': '198.51.100.8' }), body: { email: 'registrations@b2bstays.com', password: TEST_PASSWORD } });
    eq(other.statusCode, 200, 'a different address is not affected');
  });

  console.log('\nAdmin: requests');
  resetEnv();
  cookie = await signIn();
  await post(intake, goodPayload());
  await post(intake, goodPayload({ company: '=HYPERLINK("http://evil.example","click")', email: 'csv@example.com' }));
  await post(intake, goodPayload({ company: 'Quote "Travel", Ltd', email: 'q@example.com' }));
  let items;
  await test('everything needs a signed-in session', async function () {
    eq((await call(requests, { method: 'GET', headers: { 'sec-fetch-site': 'same-origin' } })).statusCode, 401);
    eq((await call(requests, { method: 'PATCH', url: '/?id=BS-AAAA-BBBB', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: { status: 'approved' } })).statusCode, 401);
    eq((await call(requests, { method: 'DELETE', url: '/?id=BS-AAAA-BBBB', headers: { origin: ORIGIN } })).statusCode, 401);
  });
  await test('the list returns the newest first, with all fields', async function () {
    const r = await call(requests, authed(cookie, { method: 'GET' }));
    eq(r.statusCode, 200); items = r.json.items; eq(items.length, 3);
    ok(items[0].receivedAt >= items[2].receivedAt, 'newest first');
    ok(items[0].data.consent.accepted === true, 'consent kept');
  });
  await test('cross-site GET and PATCH without a matching Origin are refused', async function () {
    eq((await call(requests, { method: 'GET', headers: { cookie: cookie, 'sec-fetch-site': 'cross-site' } })).statusCode, 403);
    eq((await call(requests, { method: 'PATCH', url: '/?id=' + items[0].id, headers: { cookie: cookie, 'content-type': 'application/json' }, body: { status: 'approved' } })).statusCode, 403);
    eq((await call(requests, { method: 'DELETE', url: '/?id=' + items[0].id, headers: { cookie: cookie, origin: 'https://evil.example' } })).statusCode, 403);
  });
  await test('status can be changed, history is recorded, bad values are refused', async function () {
    const id = items[0].id;
    const r = await call(requests, authed(cookie, { method: 'PATCH', url: '/?id=' + id, body: { status: 'approved' } }));
    eq(r.statusCode, 200); eq(r.json.item.status, 'approved'); eq(r.json.item.history[0].from, 'new'); eq(r.json.item.history[0].to, 'approved');
    eq((await call(requests, authed(cookie, { method: 'PATCH', url: '/?id=' + id, body: { status: 'hacked' } }))).statusCode, 422);
    eq((await call(requests, authed(cookie, { method: 'PATCH', url: '/?id=nope', body: { status: 'new' } }))).statusCode, 400);
    eq((await call(requests, authed(cookie, { method: 'PATCH', url: '/?id=BS-AAAA-BBBB', body: { status: 'new' } }))).statusCode, 404);
  });
  await test('notes are appended, trimmed and kept as plain text', async function () {
    const id = items[0].id;
    const r = await call(requests, authed(cookie, { method: 'PATCH', url: '/?id=' + id, body: { note: '  Called on WhatsApp <b>ok</b>\n' } }));
    eq(r.statusCode, 200); eq(r.json.item.notes.length, 1); eq(r.json.item.notes[0].text, 'Called on WhatsApp <b>ok</b>');
  });
  await test('CSV export: BOM, header, quoting and spreadsheet-formula protection', async function () {
    const r = await call(requests, authed(cookie, { method: 'GET', url: '/?format=csv' }));
    eq(r.statusCode, 200);
    ok(/^text\/csv/.test(r.headers['content-type']), 'content type');
    ok(/attachment; filename="access-requests-\d{4}-\d{2}-\d{2}\.csv"/.test(r.headers['content-disposition']), 'download name');
    ok(r.body.charCodeAt(0) === 0xfeff, 'BOM for Excel');
    ok(r.body.indexOf('"Reference","Received (UTC)","Status"') !== -1, 'header row');
    ok(r.body.indexOf('"\'=HYPERLINK(""http://evil.example"",""click"")"') !== -1, 'formula neutralised');
    ok(r.body.indexOf('"Quote ""Travel"", Ltd"') !== -1, 'quotes escaped');
  });
  await test('a record can be deleted for good', async function () {
    const id = items[2].id;
    eq((await call(requests, authed(cookie, { method: 'DELETE', url: '/?id=' + id }))).statusCode, 200);
    eq((await call(requests, authed(cookie, { method: 'DELETE', url: '/?id=' + id }))).statusCode, 404, 'already gone');
    eq((await call(requests, authed(cookie, { method: 'GET' }))).json.items.length, 2);
  });
  await test('the list says so when storage is not connected', async function () {
    delete process.env.B2B_DEV_STORE;
    const r = await call(requests, authed(cookie, { method: 'GET' }));
    eq(r.statusCode, 503); eq(r.json.error, 'storage_not_configured');
    process.env.B2B_DEV_STORE = 'memory';
  });

  console.log('\nAdmin: sign out');
  await test('signing out clears the cookie and the old cookie stops working', async function () {
    const before = await call(session, authed(cookie));
    eq(before.statusCode, 200);
    const out = await post(logout, {}, authed(cookie, { method: 'POST' }));
    eq(out.statusCode, 200); ok(String(out.headers['set-cookie']).indexOf('Max-Age=0') !== -1, 'cookie expired');
    eq((await call(session, authed(cookie))).statusCode, 401, 'old cookie revoked');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { console.log('Failed: ' + failures.join(' | ')); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
