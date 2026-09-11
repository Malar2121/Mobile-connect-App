const { renderNotification, NOTIFICATION_TYPES, LANGUAGES, PHRASES } = require('../../services/notificationText');

/**
 * Notifications and push messages must reach each member in English, Sinhala
 * or Tamil (proposal §6.3), and the English wording must stay exactly as it
 * was so nothing changes for existing English-speaking families.
 */
describe('Notification text in three languages', () => {
  const sample = {
    name: 'Nimal',
    child: 'Kavi',
    person: 'Aachi',
    title: 'Family picnic',
    content: 'Bring mats',
    preview: 'See you at 5',
    place: 'School',
    action: 'enter',
    kind: 'photo',
    reason: 'Ask first',
    days: 1,
    location: 'Galle Face',
    celebrationType: 'anniversary',
    age: 70,
    message: '',
    mediaKind: 'image',
  };

  it('has the same phrases in every language', () => {
    const english = Object.keys(PHRASES.en).sort();
    expect(Object.keys(PHRASES.si).sort()).toEqual(english);
    expect(Object.keys(PHRASES.ta).sort()).toEqual(english);
  });

  it('renders a non-empty title and body for every type in every language', () => {
    for (const type of NOTIFICATION_TYPES) {
      for (const language of LANGUAGES) {
        const text = renderNotification(type, sample, language);
        expect(text.title.trim()).not.toBe('');
        expect(text.body.trim()).not.toBe('');
        expect(`${text.title} ${text.body}`).not.toMatch(/\{\{\w+\}\}/);
      }
    }
  });

  it('writes Sinhala and Tamil in their own scripts', () => {
    const si = renderNotification('event_reminder', sample, 'si');
    const ta = renderNotification('event_reminder', sample, 'ta');
    expect(si.title).toMatch(/[඀-෿]/);
    expect(ta.title).toMatch(/[஀-௿]/);
  });

  it('keeps the existing English wording', () => {
    expect(renderNotification('event_reminder', sample, 'en')).toEqual({ title: 'Family picnic is tomorrow', body: 'At Galle Face' });
    expect(renderNotification('birthday_reminder', { name: 'Amma', days: 0, age: 70 }, 'en')).toEqual({
      title: "Amma's birthday is today",
      body: 'Turning 70.',
    });
    expect(renderNotification('chat_mention', { name: 'Nimal', mediaKind: 'video' }, 'en')).toEqual({
      title: 'Nimal mentioned you',
      body: 'Sent a video',
    });
  });

  it('inserts what people wrote exactly, without treating it as a template', () => {
    const text = renderNotification('chat_message', { name: '{{title}}', preview: 'Hello {{name}}' }, 'ta');
    expect(text.title).toContain('{{title}}');
    expect(text.body).toBe('Hello {{name}}');
  });

  it('falls back to English for an unknown language and to null for unknown types', () => {
    expect(renderNotification('story_created', sample, 'fr').title).toBe('Nimal shared a family story');
    expect(renderNotification('not_a_type', sample, 'en')).toBeNull();
    expect(renderNotification('story_created', undefined, 'en')).toBeNull();
  });
});
