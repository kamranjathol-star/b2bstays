'use strict';
/* Small HTTP helpers shared by every function in /api (CommonJS, no dependencies). */
const crypto = require('crypto');

const MAX_BODY_BYTES = 24 * 1024;

function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (headers) Object.keys(headers).forEach(function (k) { res.setHeader(k, headers[k]); });
  if (body === undefined) { res.end(); return; }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function fail(status, code) {
  const e = new Error(code);
  e.status = status;
  e.code = code;
  return e;
}

/** Origins that may POST to our functions. Same-origin browser requests always send an Origin header. */
function allowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (fromEnv.length) return fromEnv;
  const out = ['https://b2bstays.com', 'https://www.b2bstays.com'];
  if (process.env.VERCEL_URL) out.push('https://' + process.env.VERCEL_URL);
  return out;
}

function originOk(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  if (process.env.B2B_DEV === '1' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return allowedOrigins().indexOf(origin) !== -1;
}

/** For GET requests (browsers send no Origin there): refuse requests the browser marks as cross-site. */
function fetchSiteOk(req) {
  const site = req.headers['sec-fetch-site'];
  return !site || site === 'same-origin' || site === 'none';
}

/** Parses a JSON body (already parsed by the platform, or read from the stream) with a hard size cap. */
async function readJson(req) {
  const declared = parseInt(req.headers['content-length'] || '0', 10);
  if (declared > MAX_BODY_BYTES) throw fail(413, 'too_large');
  let raw;
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
    else if (typeof req.body === 'string') raw = req.body;
    else return req.body;
  } else {
    raw = await new Promise(function (resolve, reject) {
      let size = 0;
      const chunks = [];
      req.on('data', function (c) {
        size += c.length;
        if (size > MAX_BODY_BYTES) { reject(fail(413, 'too_large')); return; }
        chunks.push(c);
      });
      req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
      req.on('error', reject);
    });
  }
  if (raw.length > MAX_BODY_BYTES) throw fail(413, 'too_large');
  try { return JSON.parse(raw || '{}'); } catch (e) { throw fail(400, 'bad_json'); }
}

function isJson(req) {
  return /^application\/json\b/i.test(req.headers['content-type'] || '');
}

function query(req) {
  try { return Object.fromEntries(new URL(req.url, 'http://local').searchParams); } catch (e) { return {}; }
}

function clientIp(req) {
  const h = req.headers;
  const xff = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return String(h['x-vercel-forwarded-for'] || xff || h['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown');
}

/** Short, non-reversible id for rate-limit keys (we never store raw IP addresses). */
function hashKey(value) {
  const pepper = process.env.SESSION_SECRET || 'b2bstays';
  return crypto.createHmac('sha256', pepper).update(String(value)).digest('hex').slice(0, 20);
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

module.exports = { send, fail, originOk, fetchSiteOk, readJson, isJson, query, clientIp, hashKey, sleep, MAX_BODY_BYTES };
