'use strict';
/* =====================================================================
   Email notifications (SMTP). Used to tell registrations@b2bstays.com about
   every new access request. Configure with environment variables only:

     SMTP_HOST      e.g. mail.b2bstays.com
     SMTP_PORT      465 (SSL, default) or 587 (STARTTLS)
     SMTP_USER      the mailbox, e.g. registrations@b2bstays.com
     SMTP_PASS      that mailbox's password  (secret - never put it in the repo)
     NOTIFY_EMAIL   where notifications go (default: ADMIN_EMAIL, then registrations@b2bstays.com)
     MAIL_FROM      optional, default "B2B Stays <SMTP_USER>"

   B2B_DEV_MAIL=log (local dev / tests) records messages in memory instead of sending.
   ===================================================================== */

function config() {
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'registrations@b2bstays.com';
  if (process.env.B2B_DEV_MAIL === 'log') return { dev: true, to: to };
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host: host,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: user,
    pass: pass,
    to: to,
    from: process.env.MAIL_FROM || ('B2B Stays <' + user + '>')
  };
}

function enabled() { return !!config(); }
function notifyAddress() { const c = config(); return c ? c.to : ''; }

/** Header values must be a single line. */
function oneLine(s) { return String(s || '').replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }

/** @returns {Promise<{sent:boolean, reason?:string}>} - never throws */
async function send(msg) {
  const c = config();
  if (!c) return { sent: false, reason: 'not_configured' };
  const subject = oneLine(msg.subject).slice(0, 200);
  if (c.dev) {
    (globalThis.__b2bMail = globalThis.__b2bMail || []).push({ to: c.to, subject: subject, text: msg.text, replyTo: msg.replyTo || null });
    return { sent: true };
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465,
      requireTLS: c.port !== 465,
      auth: { user: c.user, pass: c.pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 15000
    });
    await transporter.sendMail({
      from: c.from,
      to: c.to,
      replyTo: msg.replyTo || undefined,
      subject: subject,
      text: msg.text
    });
    return { sent: true };
  } catch (e) {
    // Log the error code only - never credentials or message content.
    console.error('[mail] send failed:', (e && (e.code || e.responseCode)) || (e && e.message) || 'unknown');
    return { sent: false, reason: 'smtp_error' };
  }
}

module.exports = { enabled, notifyAddress, send, oneLine };
