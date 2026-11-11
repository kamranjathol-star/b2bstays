#!/usr/bin/env node
/* =====================================================================
   One command to finish the back end (and to change the admin password later):

       node tools/setup-admin.mjs

   Run it yourself in a terminal. It
     1. asks for the admin e-mail            (default registrations@b2bstays.com)
     2. asks for a new admin password        (typed hidden; only a scrypt hash is kept)
     3. asks for the mailbox password        (typed hidden; lets the site e-mail new requests
                                              to registrations@b2bstays.com). It checks the login
                                              and can send you a test e-mail.
     4. saves the settings in your Vercel project (production), passwords as write-only secrets
     5. offers to create the small free database that stores the requests (Upstash for Redis)
        if it is not connected yet

   Nothing is printed or written to a file except the NAMES of the settings.
   Afterwards redeploy once so the new settings apply.

   --dry-run   do everything except talk to Vercel / the mail server (used for testing)
   ===================================================================== */
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auth = require('../api/_lib/auth.js');
const DRY = process.argv.includes('--dry-run');

/* ---------- prompts (hidden input in a real terminal; plain lines when piped) ---------- */
let piped = null;
if (!process.stdin.isTTY) {
  const all = await new Promise((resolve) => { let s = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', (d) => (s += d)); process.stdin.on('end', () => resolve(s)); });
  piped = all.split(/\r?\n/);
}

function ask(question, opts = {}) {
  const { hidden = false, def = '' } = opts;
  if (piped) { process.stdout.write(question + '\n'); return Promise.resolve((piped.shift() || '').trim() || def); }
  return new Promise((resolve) => {
    if (!hidden) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, (a) => { rl.close(); resolve(a.trim() || def); });
      return;
    }
    process.stdout.write(question);
    let value = '';
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\r' || ch === '\n') { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.removeListener('data', onData); process.stdout.write('\n'); resolve(value || def); return; }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); continue; }
        if (ch >= ' ') value += ch;
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

const COMMON = ['password', 'passw0rd', 'qwerty', 'letmein', 'welcome', 'admin', 'b2bstays', 'iloveyou', '123456', '111111'];
function weak(pw, email) {
  if (pw.length < 12) return 'Use at least 12 characters (a few random words in a row works well).';
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low.includes(c))) return 'That contains a very common word or number. Please choose something less guessable.';
  if (email && low.includes(email.split('@')[0].toLowerCase())) return 'The password should not contain the email name.';
  if (/^(.)\1+$/.test(pw)) return 'That is one character repeated.';
  return '';
}

/* ---------- the mailbox ---------- */
function friendlyMailError(e) {
  const code = e && (e.code || e.responseCode);
  if (e && (e.responseCode === 535 || e.code === 'EAUTH')) return 'The mail server rejected the login (wrong mailbox name or password).';
  if (code === 'ENOTFOUND') return 'The mail server name was not found - check "Mail server".';
  if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNREFUSED') return 'Could not connect to the mail server (' + code + ') - check the server name and port.';
  return 'Could not log in (' + (code || (e && e.message) || 'unknown error') + ').';
}
function mailTransport(c) {
  const nodemailer = require('nodemailer');
  const port = Number(c.port);
  return nodemailer.createTransport({ host: c.host, port, secure: port === 465, requireTLS: port !== 465, auth: { user: c.user, pass: c.pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
}

/* ---------- Vercel ---------- */
function vercelAdd(name, value, sensitive) {
  const args = ['--yes', 'vercel', 'env', 'add', name, '--environment', 'production', '--force', '--yes'];
  args.push(sensitive ? '--sensitive' : '--no-sensitive');
  // The value goes in through stdin (exactly as typed, no extra newline), never on the command line.
  const r = spawnSync('npx', args, { cwd: root, input: value, encoding: 'utf8', shell: true, timeout: 120000 });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

/** Names only - Vercel never shows values of sensitive settings. */
function vercelNames() {
  const r = spawnSync('npx', ['--yes', 'vercel', 'env', 'ls', '--environment', 'production'], { cwd: root, encoding: 'utf8', shell: true, timeout: 120000 });
  return r.status === 0 ? (r.stdout || '') + (r.stderr || '') : null;
}

async function storageStep() {
  const listed = vercelNames();
  if (listed && /KV_REST_API_URL|UPSTASH_REDIS_REST_URL/.test(listed)) { console.log('\nStorage: already connected (Upstash) - nothing to do.'); return; }
  console.log('\nStorage: the admin area needs a small database to keep the requests, and it is not connected yet.');
  console.log('This creates a FREE "Upstash for Redis" database called b2bstays-requests in your Vercel account');
  console.log('and connects it to this project (production only). You will be asked to accept the Upstash terms and to');
  console.log('choose a plan (Free) and a region (pick a European one).');
  const go = (await ask('Create it now? [y/N]: ')).toLowerCase();
  if (go !== 'y' && go !== 'yes') { console.log('Skipped. Later: Vercel dashboard -> project b2bstays -> Storage -> Create Database -> Upstash for Redis.'); return; }
  const r = spawnSync('npx', ['--yes', 'vercel', 'integration', 'add', 'upstash/upstash-kv', '--name', 'b2bstays-requests', '-e', 'production', '--no-env-pull'], { cwd: root, stdio: 'inherit', shell: true });
  if (r.status !== 0) console.log('\nThat did not finish. You can do it in the Vercel dashboard instead: project b2bstays -> Storage -> Create Database -> Upstash for Redis -> connect to the project.');
  else console.log('\nStorage connected.');
}

(async function main() {
  console.log('\nB2B Stays - back-end set-up\n');
  console.log('You will type two passwords. They are hidden and are never shown, saved in a file or sent anywhere');
  console.log('except into your own Vercel project settings (as write-only secrets) and your own mail server.\n');

  const email = (await ask('Admin email [registrations@b2bstays.com]: ', { def: 'registrations@b2bstays.com' })).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { console.log('That does not look like an email address.'); process.exit(1); }

  let password = '';
  for (let attempt = 0; attempt < 3 && !password; attempt++) {
    const p1 = await ask('New admin password (min 12 characters): ', { hidden: true });
    const problem = weak(p1, email);
    if (problem) { console.log('  ' + problem); continue; }
    const p2 = await ask('Type it again: ', { hidden: true });
    if (p1 !== p2) { console.log('  The two passwords did not match. Try again.'); continue; }
    password = p1;
  }
  if (!password) { console.log('\nNo password set. Nothing was changed.'); process.exit(1); }

  console.log('\nMailbox that sends the "new request" e-mails (press Enter to skip for now).');
  const smtpHost = await ask('  Mail server [mail.b2bstays.com]: ', { def: 'mail.b2bstays.com' });
  const smtpPort = await ask('  Port [465]: ', { def: '465' });
  const smtpUser = await ask('  Mailbox login [' + email + ']: ', { def: email });
  let smtpPass = await ask('  Mailbox password (hidden, Enter to skip): ', { hidden: true });
  const notify = await ask('  Send new-request e-mails to [' + email + ']: ', { def: email });

  if (smtpPass && !DRY) {
    for (let attempt = 0; attempt < 3 && smtpPass; attempt++) {
      process.stdout.write('  Checking the mailbox login ... ');
      const t = mailTransport({ host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass });
      try {
        await t.verify();
        console.log('OK');
        const test = (await ask('  Send a test e-mail to ' + notify + ' now? [Y/n]: ', { def: 'y' })).toLowerCase();
        if (test === 'y' || test === 'yes') {
          try { await t.sendMail({ from: 'B2B Stays <' + smtpUser + '>', to: notify, subject: 'B2B Stays - test e-mail', text: 'This is a test from the B2B Stays set-up script. If you can read it, new access requests will reach this mailbox.' }); console.log('  Test e-mail sent - please check the inbox of ' + notify + '.'); }
          catch (e) { console.log('  The test e-mail could not be sent: ' + friendlyMailError(e)); }
        }
        break;
      } catch (e) {
        console.log('failed');
        console.log('    ' + friendlyMailError(e));
        smtpPass = await ask('  Type the mailbox password again (hidden), or press Enter to continue without e-mail: ', { hidden: true });
      }
    }
  }

  const hash = await auth.hashPassword(password);
  if (!(await auth.verifyPassword(password, hash))) { console.log('Internal check failed; nothing saved.'); process.exit(1); }
  password = '';

  const vars = [
    ['ADMIN_EMAIL', email, false],
    ['ADMIN_PASSWORD_HASH', hash, true],
    ['SESSION_SECRET', crypto.randomBytes(32).toString('hex'), true],
    ['NOTIFY_EMAIL', notify, false]
  ];
  if (smtpPass) vars.push(['SMTP_HOST', smtpHost, false], ['SMTP_PORT', smtpPort, false], ['SMTP_USER', smtpUser, false], ['SMTP_PASS', smtpPass, true], ['MAIL_FROM', 'B2B Stays <' + smtpUser + '>', false]);

  console.log('\nThese settings will be saved to the Vercel project (production):');
  vars.forEach((v) => console.log('  ' + v[0].padEnd(22) + (v[2] ? '(secret)' : v[1])));
  if (!smtpPass) console.log('  (no working mailbox password: e-mail notifications stay off until you run this again)');

  if (DRY) { console.log('\n--dry-run: nothing was sent to Vercel or the mail server. The password hash was created and checked OK.'); return; }

  const go = (await ask('\nSave them now? [y/N]: ')).toLowerCase();
  if (go !== 'y' && go !== 'yes') { console.log('Cancelled. Nothing was changed.'); return; }

  let failed = 0;
  for (const [name, value, sensitive] of vars) {
    process.stdout.write('  saving ' + name + ' ... ');
    const r = vercelAdd(name, value, sensitive);
    if (r.ok) console.log('done');
    else { failed++; console.log('FAILED'); console.log('    ' + r.out.trim().split('\n').slice(-3).join('\n    ').replace(value, '***')); }
  }
  if (failed) {
    console.log('\n' + failed + ' setting(s) could not be saved. Make sure you are signed in to Vercel ("npx vercel login") and try again.');
    process.exit(1);
  }
  const listed = vercelNames();
  if (listed) {
    const missing = vars.map((v) => v[0]).filter((n) => !listed.includes(n));
    console.log(missing.length ? '\nWarning: these do not show up in Vercel yet: ' + missing.join(', ') : '\nChecked in Vercel: all settings are present.');
  }

  await storageStep();

  console.log('\nLast step: redeploy so the new settings take effect (tell Claude "deploy", or run: npx vercel deploy --prod).');
  console.log('Admin page: https://b2bstays.com/admin   (sign in with ' + email + ')\n');
})();
