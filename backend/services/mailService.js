const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Outbound mail for family invitations (proposal §6.3).
 *
 * The transport is built entirely from environment variables — no credentials
 * are ever hardcoded. When SMTP is not configured the service reports that
 * plainly instead of pretending: callers get { sent: false, reason }, and the
 * invitation record keeps emailSent: false. Nothing in this project claims an
 * email was delivered unless a transport accepted it.
 */

let transporter = null;
let initialised = false;

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (initialised) return transporter;
  initialised = true;

  if (!isConfigured()) {
    logger.warn('SMTP not configured — email invitations will be created but not delivered');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transporter;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Send a family invitation.
 *
 * The email deliberately carries only the family name, the inviter's name and
 * the one-time link. No member list, no family id, no other family data — an
 * invitation goes to an address nobody has verified yet, so it must not leak
 * anything about the family beyond what the invitee was already told.
 */
async function sendInvitationEmail({ to, familyName, inviterName, token, expiresAt }) {
  const transport = getTransport();
  if (!transport) {
    return { sent: false, reason: 'mail_not_configured' };
  }

  const base = (process.env.INVITE_LINK_BASE_URL || process.env.CLIENT_URL || '').replace(/\/$/, '');
  const link = base ? `${base}/join?token=${token}` : null;
  const expiryText = new Date(expiresAt).toUTCString();

  const safeFamily = escapeHtml(familyName);
  const safeInviter = escapeHtml(inviterName);

  const text = [
    `${inviterName} has invited you to join the ${familyName} family on Family Connect.`,
    '',
    link ? `Open this link to accept: ${link}` : `Your invitation code is: ${token}`,
    '',
    `This invitation expires on ${expiryText} and can be used once.`,
    'If you were not expecting this, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#141a24">
      <h2 style="font-size:20px;margin:0 0 12px">You have been invited to ${safeFamily}</h2>
      <p style="margin:0 0 16px;line-height:1.6">
        ${safeInviter} has invited you to join the <strong>${safeFamily}</strong> family on Family Connect.
      </p>
      ${
        link
          ? `<p style="margin:0 0 20px"><a href="${escapeHtml(link)}"
               style="background:#35429E;color:#fff;padding:12px 22px;border-radius:6px;
               text-decoration:none;display:inline-block">Accept invitation</a></p>`
          : `<p style="margin:0 0 20px">Your invitation code is:
               <strong style="letter-spacing:1px">${escapeHtml(token)}</strong></p>`
      }
      <p style="margin:0;color:#5d6b80;font-size:13px;line-height:1.6">
        This invitation expires on ${escapeHtml(expiryText)} and can only be used once.<br>
        If you were not expecting this, you can safely ignore this email.
      </p>
    </div>`;

  try {
    const info = await transport.sendMail({
      from: process.env.MAIL_FROM || `Family Connect <${process.env.SMTP_USER}>`,
      to,
      subject: `${inviterName} invited you to join ${familyName} on Family Connect`,
      text,
      html,
    });
    logger.info(`Invitation email accepted by transport for ${to} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    // A delivery failure must not lose the invitation — it stays usable and
    // can be shared another way or re-sent once mail is working.
    logger.error(`Invitation email failed for ${to}: ${err.message}`);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

/** Reset cached state — used by tests that toggle SMTP configuration. */
function _resetTransportForTests() {
  transporter = null;
  initialised = false;
}

module.exports = { sendInvitationEmail, isConfigured, _resetTransportForTests };
