import { getCurrentLocale, translate } from '../i18n';

/**
 * Turn an API failure into an Error whose message the user can read in the
 * language they chose.
 *
 * English users see the server's own wording, which is the most precise.
 * Sinhala and Tamil users see a translated message chosen from the error code
 * or HTTP status, so no English sentence appears inside a Sinhala or Tamil
 * screen. The original `status`, `code` and `serverMessage` stay on the error
 * for decisions in the app.
 */

const CODE_KEYS = {
  GUEST_READ_ONLY: 'errors.guestReadOnly',
  CONSENT_PENDING: 'errors.consentPending',
  CONSENT_REJECTED: 'errors.consentRejected',
  RATE_LIMITED: 'errors.rateLimited',
  MEDIA_QUOTA_EXCEEDED: 'memories.quotaExceeded',
  SELF_REVIEW: 'errors.selfReview',
  MEMORY_REVIEW_FORBIDDEN: 'errors.reviewForbidden',
  ALREADY_REVIEWED: 'errors.alreadyReviewed',
  INVALID: 'family.invitationInvalid',
  REVOKED: 'family.invitationRevoked',
  USED: 'family.invitationUsed',
  EXPIRED: 'family.invitationExpired',
  WRONG_ACCOUNT: 'family.invitationWrongAccount',
};

const STATUS_KEYS = {
  400: 'errors.badRequest',
  401: 'errors.sessionExpired',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  410: 'errors.gone',
  413: 'errors.tooLarge',
  422: 'errors.badRequest',
  429: 'errors.rateLimited',
};

function localizedMessage({ status, code, serverMessage, url }) {
  if (code && CODE_KEYS[code]) return translate(CODE_KEYS[code]);

  const english = getCurrentLocale() === 'en';

  // A 401 from sign-in means wrong credentials, not an expired session.
  if (status === 401 && /\/auth\/(login|2fa\/login)/.test(url || '')) {
    return english && serverMessage ? serverMessage : translate('errors.invalidCredentials');
  }

  if (english && serverMessage) return serverMessage;
  if (status >= 500) return translate('errors.server');
  return translate(STATUS_KEYS[status] || 'errors.generic');
}

/** Normalise anything thrown by an axios call. */
export function normalizeApiError(error) {
  if (error?.response) {
    const { status, data } = error.response;
    const err = new Error(
      localizedMessage({ status, code: data?.code, serverMessage: data?.message, url: error.config?.url }),
    );
    err.status = status;
    err.code = data?.code;
    err.serverMessage = data?.message;
    err.data = data;
    return err;
  }
  if (error?.isNetworkError || error?.request) {
    const err = new Error(translate('errors.network'));
    err.isNetworkError = true;
    return err;
  }
  return error instanceof Error ? error : new Error(translate('errors.generic'));
}

/** For a successful HTTP response whose body reports `success: false`. */
export function apiFailure(body) {
  const err = new Error(localizedMessage({ status: 200, code: body?.code, serverMessage: body?.message }));
  // The server answered, so this is never an offline failure to queue and retry.
  err.status = 200;
  err.code = body?.code;
  err.serverMessage = body?.message;
  return err;
}
