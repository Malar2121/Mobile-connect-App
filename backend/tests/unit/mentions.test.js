const { parseMentions } = require('../../controllers/chatController');

const members = [
  { _id: 'u1', fullName: 'Amma' },
  { _id: 'u2', fullName: 'Amma Kumari' },
  { _id: 'u3', fullName: 'Appa' },
  { _id: 'u4', fullName: 'Ammar' },
];

describe('parseMentions (proposal §6.3 — chat mentions)', () => {
  it('resolves a simple mention to the member id', () => {
    expect(parseMentions('Hi @Appa can you help?', members)).toEqual(['u3']);
  });

  it('prefers the longest matching name so one tag means one person', () => {
    expect(parseMentions('Thanks @Amma Kumari!', members)).toEqual(['u2']);
  });

  it('does not match a name that is a prefix of a longer word', () => {
    // "@Ammar" must not tag Amma.
    expect(parseMentions('Hello @Ammar', members)).toEqual(['u4']);
  });

  it('tags multiple distinct members in one message', () => {
    const result = parseMentions('@Amma and @Appa please read', members);
    expect(result.sort()).toEqual(['u1', 'u3']);
  });

  it('does not duplicate a member mentioned twice', () => {
    expect(parseMentions('@Appa @Appa @Appa', members)).toEqual(['u3']);
  });

  it('ignores an "@" that names nobody', () => {
    expect(parseMentions('email me @ home', members)).toEqual([]);
    expect(parseMentions('@Nobody here', members)).toEqual([]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseMentions('', members)).toEqual([]);
    expect(parseMentions(null, members)).toEqual([]);
    expect(parseMentions('@Appa', [])).toEqual([]);
    expect(parseMentions('@Appa', undefined)).toEqual([]);
  });

  it('treats regex characters in a name literally rather than as a pattern', () => {
    const odd = [{ _id: 'u9', fullName: 'A.B (Sr.)' }];
    expect(parseMentions('hi @A.B (Sr.)', odd)).toEqual(['u9']);
    // The dot must not behave as "any character".
    expect(parseMentions('hi @AXB (Sr.)', odd)).toEqual([]);
  });

  it('matches names in non-Latin scripts', () => {
    const tamil = [{ _id: 'u10', fullName: 'அம்மா' }];
    expect(parseMentions('வணக்கம் @அம்மா', tamil)).toEqual(['u10']);
  });

  it('accepts members keyed by id instead of _id', () => {
    expect(parseMentions('@Appa', [{ id: 'x1', fullName: 'Appa' }])).toEqual(['x1']);
  });
});
