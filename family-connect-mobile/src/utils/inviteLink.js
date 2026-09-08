/**
 * Parse whatever a Family Connect QR code or invite link contains.
 *
 * Two things can be encoded, and they join by different routes:
 *   - an invite CODE  (ABCD-EFGH) — the shareable family code
 *   - an invite TOKEN (64 hex chars) — a one-time emailed invitation
 *
 * Both may arrive bare or wrapped in a link, so parsing is done here once and
 * the scanner simply reports what it found. Anything else is rejected rather
 * than guessed at, so scanning an unrelated QR gives a clear message instead
 * of a confusing server error.
 */

const CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function readQueryParam(value, key) {
  // Deliberately not using the URL class: React Native's implementation is
  // incomplete and throws on inputs this needs to handle gracefully.
  const match = new RegExp(`[?&]${key}=([^&#\\s]+)`, 'i').exec(value);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * @returns {{kind: 'code'|'token', value: string} | {kind: 'invalid', reason: string}}
 */
export function parseInviteScan(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return { kind: 'invalid', reason: 'empty' };

  const token = readQueryParam(text, 'token');
  if (token && TOKEN_PATTERN.test(token)) return { kind: 'token', value: token };

  const code = readQueryParam(text, 'code');
  if (code && CODE_PATTERN.test(code.toUpperCase())) {
    return { kind: 'code', value: code.toUpperCase() };
  }

  // Bare values, e.g. a code typed by hand or a QR holding only the code.
  const upper = text.toUpperCase();
  if (CODE_PATTERN.test(upper)) return { kind: 'code', value: upper };
  if (TOKEN_PATTERN.test(text)) return { kind: 'token', value: text };

  // A link that is ours in shape but carries nothing usable.
  if (/\/join\b/i.test(text)) return { kind: 'invalid', reason: 'link_missing_code' };

  return { kind: 'invalid', reason: 'not_an_invite' };
}

/** True when the string looks like something this app should act on. */
export function isInviteScan(raw) {
  return parseInviteScan(raw).kind !== 'invalid';
}
