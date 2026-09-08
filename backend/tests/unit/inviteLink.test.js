const { parseInviteScan, isInviteScan } = require('../../../family-connect-mobile/src/utils/inviteLink');

/**
 * QR scan parsing (proposal §5.2 — "easy onboarding using QR code invitations").
 * A scanner that mis-reads a QR sends nonsense to the server, so the parser is
 * tested here rather than left to be discovered on a device.
 */
describe('parseInviteScan', () => {
  const CODE = 'ABCD-EFGH';
  const TOKEN = 'a'.repeat(64);

  describe('invite codes', () => {
    it('reads a bare code', () => {
      expect(parseInviteScan(CODE)).toEqual({ kind: 'code', value: CODE });
    });

    it('reads a code from a join link', () => {
      expect(parseInviteScan(`https://familyconnect.app/join?code=${CODE}`)).toEqual({
        kind: 'code',
        value: CODE,
      });
    });

    it('uppercases a lowercase code', () => {
      expect(parseInviteScan('abcd-efgh')).toEqual({ kind: 'code', value: CODE });
    });

    it('tolerates surrounding whitespace', () => {
      expect(parseInviteScan(`  ${CODE}  `)).toEqual({ kind: 'code', value: CODE });
    });

    it('reads a code when other query params follow', () => {
      expect(parseInviteScan(`https://x.app/join?code=${CODE}&ref=email`)).toEqual({
        kind: 'code',
        value: CODE,
      });
    });
  });

  describe('email invitation tokens', () => {
    it('reads a bare token', () => {
      expect(parseInviteScan(TOKEN)).toEqual({ kind: 'token', value: TOKEN });
    });

    it('reads a token from a link', () => {
      expect(parseInviteScan(`https://familyconnect.app/join?token=${TOKEN}`)).toEqual({
        kind: 'token',
        value: TOKEN,
      });
    });

    it('prefers a token when a link carries both', () => {
      const result = parseInviteScan(`https://x.app/join?code=${'ABCD-EFGH'}&token=${TOKEN}`);
      expect(result).toEqual({ kind: 'token', value: TOKEN });
    });
  });

  describe('rejections', () => {
    it('rejects an unrelated QR code', () => {
      expect(parseInviteScan('https://example.com').kind).toBe('invalid');
      expect(parseInviteScan('WIFI:S:MyNetwork;T:WPA;;').kind).toBe('invalid');
    });

    it('rejects an empty scan', () => {
      expect(parseInviteScan('').reason).toBe('empty');
      expect(parseInviteScan(null).reason).toBe('empty');
      expect(parseInviteScan(undefined).reason).toBe('empty');
    });

    it('reports a join link that carries no usable code', () => {
      expect(parseInviteScan('https://familyconnect.app/join').reason).toBe('link_missing_code');
      expect(parseInviteScan('https://familyconnect.app/join?code=NOTVALID').reason).toBe(
        'link_missing_code',
      );
    });

    it('rejects a malformed code rather than passing it to the server', () => {
      expect(parseInviteScan('ABCDEFGH').kind).toBe('invalid');
      expect(parseInviteScan('AB-CD').kind).toBe('invalid');
      expect(parseInviteScan('abcd_efgh').kind).toBe('invalid');
    });

    it('rejects a token of the wrong length', () => {
      expect(parseInviteScan('a'.repeat(63)).kind).toBe('invalid');
      expect(parseInviteScan('z'.repeat(64)).kind).toBe('invalid'); // not hex
    });
  });

  describe('isInviteScan', () => {
    it('agrees with parseInviteScan', () => {
      expect(isInviteScan(CODE)).toBe(true);
      expect(isInviteScan(TOKEN)).toBe(true);
      expect(isInviteScan('https://example.com')).toBe(false);
    });
  });
});
