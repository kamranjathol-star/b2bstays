'use strict';
/* =====================================================================
   Storage for access requests (+ rate-limit counters and revoked sessions).

   Production : Upstash Redis over its REST API (plain fetch, no package).
                Add it in Vercel -> Storage -> Upstash Redis -> connect to the
                project; Vercel then provides KV_REST_API_URL / KV_REST_API_TOKEN
                (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
   Local dev  : B2B_DEV_STORE=memory keeps everything in memory.
   Nothing configured -> available() is false and callers degrade gracefully.
   ===================================================================== */

const INDEX_KEY = 'req:index';

/* ---------- in-memory backend (dev + tests) ---------- */
function memoryBackend() {
  const g = globalThis;
  if (!g.__b2bMem) g.__b2bMem = { kv: new Map(), zsets: new Map() };
  const mem = g.__b2bMem;
  function alive(k) {
    const e = mem.kv.get(k);
    if (!e) return undefined;
    if (e.exp && e.exp <= Date.now()) { mem.kv.delete(k); return undefined; }
    return e;
  }
  return {
    reset: function () { mem.kv.clear(); mem.zsets.clear(); },
    cmd: async function (a) {
      const c = String(a[0]).toUpperCase();
      if (c === 'SET') {
        const key = a[1], val = a[2], opts = a.slice(3).map(function (x) { return String(x).toUpperCase(); });
        const nx = opts.indexOf('NX') !== -1;
        const exi = opts.indexOf('EX');
        if (nx && alive(key)) return null;
        mem.kv.set(key, { v: String(val), exp: exi !== -1 ? Date.now() + parseInt(a[3 + exi + 1], 10) * 1000 : 0 });
        return 'OK';
      }
      if (c === 'GET') { const e = alive(a[1]); return e ? e.v : null; }
      if (c === 'MGET') return a.slice(1).map(function (k) { const e = alive(k); return e ? e.v : null; });
      if (c === 'DEL') { let n = 0; a.slice(1).forEach(function (k) { if (mem.kv.delete(k)) n++; }); return n; }
      if (c === 'INCR') {
        const e = alive(a[1]);
        const n = (e ? parseInt(e.v, 10) : 0) + 1;
        mem.kv.set(a[1], { v: String(n), exp: e ? e.exp : 0 });
        return n;
      }
      if (c === 'EXPIRE') { const e = alive(a[1]); if (!e) return 0; e.exp = Date.now() + parseInt(a[2], 10) * 1000; return 1; }
      if (c === 'ZADD') {
        const z = mem.zsets.get(a[1]) || new Map();
        z.set(String(a[3]), Number(a[2]));
        mem.zsets.set(a[1], z);
        return 1;
      }
      if (c === 'ZREM') { const z = mem.zsets.get(a[1]); return z && z.delete(String(a[2])) ? 1 : 0; }
      if (c === 'ZREVRANGE') {
        const z = mem.zsets.get(a[1]) || new Map();
        const sorted = Array.from(z.entries()).sort(function (x, y) { return y[1] - x[1]; }).map(function (e) { return e[0]; });
        const stop = parseInt(a[3], 10);
        return sorted.slice(parseInt(a[2], 10), stop < 0 ? undefined : stop + 1);
      }
      throw new Error('memory store: unsupported ' + c);
    }
  };
}

/* ---------- Upstash REST backend ---------- */
function restConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && token ? { url: url.replace(/\/+$/, ''), token: token } : null;
}

function restBackend(c) {
  return {
    cmd: async function (args) {
      const res = await fetch(c.url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(8000)
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.error) throw new Error('store error: ' + (data.error || res.status));
      return data.result;
    }
  };
}

function backend() {
  if (process.env.B2B_DEV_STORE === 'memory') return memoryBackend();
  const c = restConfig();
  return c ? restBackend(c) : null;
}

function available() { return !!backend(); }

/* ---------- soft rate limiting when no store is configured (per warm instance only) ---------- */
function localHit(key, windowSec) {
  const g = globalThis;
  if (!g.__b2bHits) g.__b2bHits = new Map();
  const now = Date.now();
  const e = g.__b2bHits.get(key);
  if (!e || e.exp <= now) { g.__b2bHits.set(key, { n: 1, exp: now + windowSec * 1000 }); return 1; }
  e.n += 1;
  return e.n;
}
function localCount(key) {
  const e = (globalThis.__b2bHits || new Map()).get(key);
  return e && e.exp > Date.now() ? e.n : 0;
}

/* ---------- counters ---------- */
async function hit(key, windowSec) {
  const b = backend();
  if (!b) return localHit(key, windowSec);
  try {
    const n = await b.cmd(['INCR', key]);
    if (n === 1) await b.cmd(['EXPIRE', key, String(windowSec)]);
    return n;
  } catch (e) { return localHit(key, windowSec); }
}
async function count(key) {
  const b = backend();
  if (!b) return localCount(key);
  try { return parseInt(await b.cmd(['GET', key]), 10) || 0; } catch (e) { return localCount(key); }
}
/** true the first time a key is seen inside its window (used to ignore double submits). */
async function once(key, ttlSec) {
  const b = backend();
  if (!b) return localHit(key, ttlSec) === 1;
  try { return (await b.cmd(['SET', key, '1', 'EX', String(ttlSec), 'NX'])) === 'OK'; } catch (e) { return true; }
}

/* ---------- revoked sessions ---------- */
async function revoke(jti, ttlSec) {
  const b = backend();
  if (b) await b.cmd(['SET', 'revoked:' + jti, '1', 'EX', String(Math.max(1, ttlSec))]);
}
async function isRevoked(jti) {
  const b = backend();
  if (!b) return false;
  try { return (await b.cmd(['GET', 'revoked:' + jti])) !== null; } catch (e) { return false; }
}

/* ---------- access requests ---------- */
function need() {
  const b = backend();
  if (!b) throw Object.assign(new Error('storage_not_configured'), { status: 503, code: 'storage_not_configured' });
  return b;
}
async function createRequest(rec) {
  const b = need();
  const ok = await b.cmd(['SET', 'req:' + rec.id, JSON.stringify(rec), 'NX']);
  if (ok !== 'OK') throw new Error('id_collision');
  await b.cmd(['ZADD', INDEX_KEY, String(Date.parse(rec.receivedAt)), rec.id]);
}
async function getRequest(id) {
  const raw = await need().cmd(['GET', 'req:' + id]);
  return raw ? JSON.parse(raw) : null;
}
async function listRequests(limit) {
  const b = need();
  const ids = await b.cmd(['ZREVRANGE', INDEX_KEY, '0', String((limit || 500) - 1)]);
  if (!ids || !ids.length) return [];
  const raws = await b.cmd(['MGET'].concat(ids.map(function (id) { return 'req:' + id; })));
  const out = [];
  (raws || []).forEach(function (r) { if (r) { try { out.push(JSON.parse(r)); } catch (e) { /* skip a corrupt record */ } } });
  return out;
}
async function saveRequest(rec) {
  await need().cmd(['SET', 'req:' + rec.id, JSON.stringify(rec)]);
}
async function deleteRequest(id) {
  const b = need();
  await b.cmd(['DEL', 'req:' + id]);
  await b.cmd(['ZREM', INDEX_KEY, id]);
}

module.exports = { available, hit, count, once, revoke, isRevoked, createRequest, getRequest, listRequests, saveRequest, deleteRequest, _memory: memoryBackend };
