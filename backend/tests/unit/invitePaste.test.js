const { parseInviteScan } = require('../../../family-connect-mobile/src/utils/inviteLink');

/**
 * Onboarding by email (proposal §6.3). The invitation email carries a one-time
 * code that the invitee pastes into Join Family. People paste whole lines, so
 * the parser must find the token inside surrounding text — without mistaking
 * part of a longer hex string for one.
 */
describe('Pasting an emailed invitation into Join Family', () => {
  const token = `${'a'.repeat(32)}0123456789abcdef0123456789abcdef`;

  it('finds the token in a pasted sentence', () => {
    expect(parseInviteScan(`paste this invitation code: ${token}`)).toEqual({ kind: 'token', value: token });
  });

  it('finds the token in a pasted link', () => {
    const line = `Or open this link on your phone: https://example.org/join?token=${token}`;
    expect(parseInviteScan(line)).toEqual({ kind: 'token', value: token });
  });

  it('accepts the bare token with surrounding whitespace', () => {
    expect(parseInviteScan(`  ${token}\n`)).toEqual({ kind: 'token', value: token });
  });

  it('does not take part of a longer hex string as a token', () => {
    expect(parseInviteScan(`${token}ff`).kind).toBe('invalid');
  });

  it('still reads a typed family code', () => {
    expect(parseInviteScan('abcd-efgh')).toEqual({ kind: 'code', value: 'ABCD-EFGH' });
  });

  it('rejects ordinary text', () => {
    expect(parseInviteScan('see you at the reunion').kind).toBe('invalid');
  });
});
