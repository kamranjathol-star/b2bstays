'use strict';
/* =====================================================================
   Admin authentication.

     ADMIN_EMAIL          the one admin account, e.g. registrations@b2bstays.com
     ADMIN_PASSWORD_HASH  scrypt hash of the password (made by tools/setup-admin.mjs;
                          the password itself is never stored anywhere)
     SESSION_SECRET       random string, 32+ characters, signs the session cookie

   A successful sign-in sets an HttpOnly, Secure, SameSite=Strict cookie that is only
   sent to /api/admin/*. It is signed (HMAC-SHA256), expires after 8 hours and stops
   working as soon as the password hash changes or the secret is rotated.
   ===================================================================== */
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const store = require('./store');

const PARAMS = { N: 16384, r: 8, p: 5, keylen: 32 };
const COOKIE = 'bs_admin';
const SESSION_SECONDS = 8 * 3600;
const COOKIE_PATH = '/api/admin';

function adminEmail() { return String(process.env.ADMIN_EMAIL || 'registrations@b2bstays.com').trim().toLowerCase(); }
function secret() { const s = process.env.SESSION_SECRET || ''; return s.length >= 32 ? s : null; }
function ready() { return !!(process.env.ADMIN_PASSWORD_HASH && secret()); }

/* ---------- password hashing ---------- */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password).normalize('NFKC'), salt, PARAMS.keylen, { N: PARAMS.N, r: PARAMS.r, p: PARAMS.p, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

// Used when the stored hash is unusable, so the response time does not give anything away.
const DUMMY = 'scrypt$16384$8$5$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

async function verifyPassword(password, stored) {
  let parts = String(stored || '').split('$');
  let valid = parts.length === 6 && parts[0] === 'scrypt';
  if (!valid) parts = DUMMY.split('$');
  const N = parseInt(parts[1], 10), r = parseInt(parts[2], 10), p = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (!(N >= 1024 && N <= 1 << 18 && r >= 1 && r <= 16 && p >= 1 && p <= 16 && expected.length >= 16)) return false;
  const key = await scrypt(String(password).normalize('NFKC'), salt, expected.length, { N: N, r: r, p: p, maxmem: 256 * 1024 * 1024 });
  return crypto.timingSafeEqual(key, expected) && valid;
}

function sameText(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Always does the same amount of work whether the e-mail or the password is wrong. */
async function checkCredentials(email, password) {
  const passOk = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  const mailOk = sameText(String(email).trim().toLowerCase(), adminEmail());
  return passOk && mailOk;
}

/* ---------- session cookie ---------- */
function passwordVersion() {
  return crypto.createHash('sha256').update(String(process.env.ADMIN_PASSWORD_HASH || '')).digest('hex').slice(0, 10);
}
function sign(data) { return crypto.createHmac('sha256', secret()).update(data).digest('base64url'); }

function issueSession() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { e: adminEmail(), iat: now, exp: now + SESSION_SECONDS, j: crypto.randomBytes(9).toString('base64url'), pv: passwordVersion() };
  const body = 'v1.' + Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: body + '.' + sign(body), payload: payload };
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

/** @returns {Promise<object|null>} the session payload, or null when not signed in */
async function readSession(req) {
  if (!secret()) return null;
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token || token.indexOf('v1.') !== 0) return null;
  const dot = token.lastIndexOf('.');
  const body = token.slice(0, dot), sig = token.slice(dot + 1);
  const good = Buffer.from(sign(body)), given = Buffer.from(sig);
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body.slice(3), 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  if (payload.pv !== passwordVersion() || payload.e !== adminEmail()) return null;
  if (await store.isRevoked(payload.j)) return null;
  return payload;
}

function sessionCookie(token, maxAge) {
  const parts = [COOKIE + '=' + token, 'Path=' + COOKIE_PATH, 'HttpOnly', 'SameSite=Strict', 'Max-Age=' + maxAge];
  if (process.env.B2B_DEV !== '1') parts.push('Secure');
  return parts.join('; ');
}

module.exports = { adminEmail, ready, hashPassword, verifyPassword, checkCredentials, issueSession, readSession, sessionCookie, SESSION_SECONDS };
