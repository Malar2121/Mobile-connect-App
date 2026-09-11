/**
 * Notification text in the language each member chose (proposal §6.3:
 * English, Sinhala and Tamil). In-app notifications and push messages are
 * rendered per recipient, so a Tamil-speaking grandparent and an
 * English-speaking cousin each read the same reminder in their own language.
 *
 * Only the fixed wording is translated. Names, message text, titles and other
 * content people wrote are inserted exactly as written.
 */

const LANGUAGES = ['en', 'si', 'ta'];

const PHRASES = {
  en: {
    chatTitle: '{{name}} sent a message',
    mentionTitle: '{{name}} mentioned you',
    mediaImage: 'Sent a photo',
    mediaVideo: 'Sent a video',
    mediaAudio: 'Sent a voice message',
    mediaDocument: 'Sent a document',
    consentRequestedTitle: 'A child account needs your approval',
    consentRequestedBody: '{{child}} has joined and is waiting for a guardian to approve their account.',
    consentApprovedTitle: 'Your account was approved',
    consentApprovedBody: '{{name}} approved your family account.',
    consentRejectedTitle: 'Your account was not approved',
    consentRejectedBody: '{{name}} did not approve your family account.',
    eventCreatedTitle: 'New Family Event! 📅',
    eventCreatedBody: '{{name}} created: {{title}}',
    eventCommentTitle: 'New Event Comment',
    commentBody: '{{name}} commented: {{content}}',
    legacyCreatedTitle: 'Legacy Profile Created',
    legacyCreatedBody: 'A memorial profile has been created for {{person}}.',
    legacyTributeTitle: 'New Tribute',
    legacyTributeBody: '{{name}} shared a tribute on a memorial profile.',
    zoneArrivedTitle: '{{name}} arrived at {{place}}',
    zoneLeftTitle: '{{name}} left {{place}}',
    zoneArrivedBody: 'Safe zone entered',
    zoneLeftBody: 'Safe zone exited',
    geofenceTitle: 'Geofence Alert',
    placeArrivedBody: 'A family member just arrived at {{place}}.',
    placeLeftBody: 'A family member just left {{place}}.',
    placeUnknown: 'a location',
    sosTitle: 'SOS from {{name}}',
    sosBody: 'Emergency alert — tap to view location',
    memoryReviewTitle: 'A memory is waiting for approval',
    memoryReviewPhotoBody: '{{name}} shared a new photo. Approve it before the family can see it.',
    memoryReviewVideoBody: '{{name}} shared a new video. Approve it before the family can see it.',
    memoryNewTitle: 'New Memory! 📸',
    memoryNewPhotoBody: '{{name}} shared a new photo.',
    memoryNewVideoBody: '{{name}} shared a new video.',
    memoryApprovedTitle: 'Your memory was approved',
    memoryApprovedPhotoBody: '{{name}} approved your photo. The family can see it now.',
    memoryApprovedVideoBody: '{{name}} approved your video. The family can see it now.',
    memoryRejectedTitle: 'Your memory was not approved',
    memoryRejectedPhotoBody: '{{name}} did not approve your photo.',
    memoryRejectedVideoBody: '{{name}} did not approve your video.',
    reasonSuffix: 'Reason: {{reason}}',
    memoryCommentTitle: 'New Memory Comment',
    storyCreatedTitle: '{{name}} shared a family story',
    whenToday: 'today',
    whenTomorrow: 'tomorrow',
    whenDays: 'in {{count}} days',
    reminderTitle: '{{title}} is {{when}}',
    eventReminderAt: 'At {{location}}',
    eventReminderDetails: 'Tap to see the details.',
    anniversaryBody: 'An anniversary is coming up.',
    celebrationBody: 'A family celebration is coming up.',
    birthdayTitle: "{{name}}'s birthday is {{when}}",
    birthdayTurning: 'Turning {{age}}.',
    birthdayWish: "Don't forget to wish them well.",
  },
  si: {
    chatTitle: '{{name}} පණිවිඩයක් එවා ඇත',
    mentionTitle: '{{name}} ඔබව සඳහන් කළා',
    mediaImage: 'ඡායාරූපයක් එවා ඇත',
    mediaVideo: 'වීඩියෝවක් එවා ඇත',
    mediaAudio: 'හඬ පණිවිඩයක් එවා ඇත',
    mediaDocument: 'ලේඛනයක් එවා ඇත',
    consentRequestedTitle: 'ළමා ගිණුමකට ඔබේ අනුමැතිය අවශ්‍යයි',
    consentRequestedBody: '{{child}} එක් වී ඇති අතර ගිණුම අනුමත කිරීමට භාරකරුවෙකු බලාපොරොත්තුවෙන් සිටී.',
    consentApprovedTitle: 'ඔබේ ගිණුම අනුමත කරන ලදී',
    consentApprovedBody: '{{name}} ඔබේ පවුල් ගිණුම අනුමත කළා.',
    consentRejectedTitle: 'ඔබේ ගිණුම අනුමත කළේ නැත',
    consentRejectedBody: '{{name}} ඔබේ පවුල් ගිණුම අනුමත කළේ නැත.',
    eventCreatedTitle: 'නව පවුල් සිදුවීමක්! 📅',
    eventCreatedBody: '{{name}} නිර්මාණය කළා: {{title}}',
    eventCommentTitle: 'නව සිදුවීම් සටහනක්',
    commentBody: '{{name}}: {{content}}',
    legacyCreatedTitle: 'අනුස්මරණ පැතිකඩක් සාදන ලදී',
    legacyCreatedBody: '{{person}} සඳහා අනුස්මරණ පැතිකඩක් සාදා ඇත.',
    legacyTributeTitle: 'නව උපහාරයක්',
    legacyTributeBody: '{{name}} අනුස්මරණ පැතිකඩක උපහාරයක් බෙදාගත්තා.',
    zoneArrivedTitle: '{{name}} {{place}} වෙත පැමිණියා',
    zoneLeftTitle: '{{name}} {{place}} හැර ගියා',
    zoneArrivedBody: 'ආරක්ෂිත කලාපයට ඇතුළු විය',
    zoneLeftBody: 'ආරක්ෂිත කලාපයෙන් ඉවත් විය',
    geofenceTitle: 'ස්ථාන දැනුම්දීම',
    placeArrivedBody: 'පවුලේ සාමාජිකයෙක් {{place}} වෙත පැමිණියා.',
    placeLeftBody: 'පවුලේ සාමාජිකයෙක් {{place}} හැර ගියා.',
    placeUnknown: 'ස්ථානයක්',
    sosTitle: '{{name}} ගෙන් SOS',
    sosBody: 'හදිසි අනතුරු ඇඟවීමකි — ස්ථානය බැලීමට තට්ටු කරන්න',
    memoryReviewTitle: 'මතකයක් අනුමැතිය බලාපොරොත්තුවෙන්',
    memoryReviewPhotoBody: '{{name}} නව ඡායාරූපයක් බෙදාගත්තා. පවුලට පෙනීමට පෙර එය අනුමත කරන්න.',
    memoryReviewVideoBody: '{{name}} නව වීඩියෝවක් බෙදාගත්තා. පවුලට පෙනීමට පෙර එය අනුමත කරන්න.',
    memoryNewTitle: 'නව මතකයක්! 📸',
    memoryNewPhotoBody: '{{name}} නව ඡායාරූපයක් බෙදාගත්තා.',
    memoryNewVideoBody: '{{name}} නව වීඩියෝවක් බෙදාගත්තා.',
    memoryApprovedTitle: 'ඔබේ මතකය අනුමත කරන ලදී',
    memoryApprovedPhotoBody: '{{name}} ඔබේ ඡායාරූපය අනුමත කළා. දැන් පවුලට එය දැකිය හැක.',
    memoryApprovedVideoBody: '{{name}} ඔබේ වීඩියෝව අනුමත කළා. දැන් පවුලට එය දැකිය හැක.',
    memoryRejectedTitle: 'ඔබේ මතකය අනුමත කළේ නැත',
    memoryRejectedPhotoBody: '{{name}} ඔබේ ඡායාරූපය අනුමත කළේ නැත.',
    memoryRejectedVideoBody: '{{name}} ඔබේ වීඩියෝව අනුමත කළේ නැත.',
    reasonSuffix: 'හේතුව: {{reason}}',
    memoryCommentTitle: 'මතකයකට නව අදහසක්',
    storyCreatedTitle: '{{name}} පවුලේ කතාවක් බෙදාගත්තා',
    whenToday: 'අද',
    whenTomorrow: 'හෙට',
    whenDays: 'දින {{count}} කින්',
    reminderTitle: '{{title}} — {{when}}',
    eventReminderAt: 'ස්ථානය: {{location}}',
    eventReminderDetails: 'විස්තර බැලීමට තට්ටු කරන්න.',
    anniversaryBody: 'සංවත්සරයක් ළඟ එයි.',
    celebrationBody: 'පවුලේ සැමරුමක් ළඟ එයි.',
    birthdayTitle: '{{name}}ගේ උපන්දිනය {{when}}',
    birthdayTurning: 'වයස අවුරුදු {{age}} සපිරේ.',
    birthdayWish: 'සුබ පැතීමට අමතක කරන්න එපා.',
  },
  ta: {
    chatTitle: '{{name}} ஒரு செய்தி அனுப்பினார்',
    mentionTitle: '{{name}} உங்களைக் குறிப்பிட்டார்',
    mediaImage: 'ஒரு புகைப்படம் அனுப்பப்பட்டது',
    mediaVideo: 'ஒரு வீடியோ அனுப்பப்பட்டது',
    mediaAudio: 'ஒரு குரல் செய்தி அனுப்பப்பட்டது',
    mediaDocument: 'ஓர் ஆவணம் அனுப்பப்பட்டது',
    consentRequestedTitle: 'ஒரு குழந்தைக் கணக்குக்கு உங்கள் ஒப்புதல் தேவை',
    consentRequestedBody: '{{child}} சேர்ந்துள்ளார்; கணக்குக்குப் பாதுகாவலரின் ஒப்புதலுக்காகக் காத்திருக்கிறார்.',
    consentApprovedTitle: 'உங்கள் கணக்குக்கு ஒப்புதல் அளிக்கப்பட்டது',
    consentApprovedBody: '{{name}} உங்கள் குடும்பக் கணக்குக்கு ஒப்புதல் அளித்தார்.',
    consentRejectedTitle: 'உங்கள் கணக்குக்கு ஒப்புதல் அளிக்கப்படவில்லை',
    consentRejectedBody: '{{name}} உங்கள் குடும்பக் கணக்குக்கு ஒப்புதல் அளிக்கவில்லை.',
    eventCreatedTitle: 'புதிய குடும்ப நிகழ்வு! 📅',
    eventCreatedBody: '{{name}} உருவாக்கினார்: {{title}}',
    eventCommentTitle: 'நிகழ்வில் புதிய குறிப்பு',
    commentBody: '{{name}}: {{content}}',
    legacyCreatedTitle: 'நினைவுப் பக்கம் உருவாக்கப்பட்டது',
    legacyCreatedBody: '{{person}} அவர்களுக்கு ஒரு நினைவுப் பக்கம் உருவாக்கப்பட்டுள்ளது.',
    legacyTributeTitle: 'புதிய அஞ்சலி',
    legacyTributeBody: '{{name}} ஒரு நினைவுப் பக்கத்தில் அஞ்சலி பகிர்ந்தார்.',
    zoneArrivedTitle: '{{name}} {{place}} வந்தடைந்தார்',
    zoneLeftTitle: '{{name}} {{place}} விட்டுச் சென்றார்',
    zoneArrivedBody: 'பாதுகாப்பு மண்டலத்திற்குள் நுழைந்தார்',
    zoneLeftBody: 'பாதுகாப்பு மண்டலத்திலிருந்து வெளியேறினார்',
    geofenceTitle: 'இருப்பிட எச்சரிக்கை',
    placeArrivedBody: 'ஒரு குடும்ப உறுப்பினர் {{place}} வந்தடைந்தார்.',
    placeLeftBody: 'ஒரு குடும்ப உறுப்பினர் {{place}} விட்டுச் சென்றார்.',
    placeUnknown: 'ஓர் இடம்',
    sosTitle: '{{name}} அவர்களிடமிருந்து SOS',
    sosBody: 'அவசர எச்சரிக்கை — இருப்பிடத்தைக் காண தட்டவும்',
    memoryReviewTitle: 'ஒரு நினைவு ஒப்புதலுக்காகக் காத்திருக்கிறது',
    memoryReviewPhotoBody: '{{name}} ஒரு புதிய புகைப்படத்தைப் பகிர்ந்தார். குடும்பத்தினர் பார்ப்பதற்கு முன் ஒப்புதல் அளிக்கவும்.',
    memoryReviewVideoBody: '{{name}} ஒரு புதிய வீடியோவைப் பகிர்ந்தார். குடும்பத்தினர் பார்ப்பதற்கு முன் ஒப்புதல் அளிக்கவும்.',
    memoryNewTitle: 'புதிய நினைவு! 📸',
    memoryNewPhotoBody: '{{name}} ஒரு புதிய புகைப்படத்தைப் பகிர்ந்தார்.',
    memoryNewVideoBody: '{{name}} ஒரு புதிய வீடியோவைப் பகிர்ந்தார்.',
    memoryApprovedTitle: 'உங்கள் நினைவுக்கு ஒப்புதல் அளிக்கப்பட்டது',
    memoryApprovedPhotoBody: '{{name}} உங்கள் புகைப்படத்திற்கு ஒப்புதல் அளித்தார். இப்போது குடும்பத்தினர் பார்க்கலாம்.',
    memoryApprovedVideoBody: '{{name}} உங்கள் வீடியோவுக்கு ஒப்புதல் அளித்தார். இப்போது குடும்பத்தினர் பார்க்கலாம்.',
    memoryRejectedTitle: 'உங்கள் நினைவுக்கு ஒப்புதல் அளிக்கப்படவில்லை',
    memoryRejectedPhotoBody: '{{name}} உங்கள் புகைப்படத்திற்கு ஒப்புதல் அளிக்கவில்லை.',
    memoryRejectedVideoBody: '{{name}} உங்கள் வீடியோவுக்கு ஒப்புதல் அளிக்கவில்லை.',
    reasonSuffix: 'காரணம்: {{reason}}',
    memoryCommentTitle: 'நினைவில் புதிய கருத்து',
    storyCreatedTitle: '{{name}} ஒரு குடும்பக் கதையைப் பகிர்ந்தார்',
    whenToday: 'இன்று',
    whenTomorrow: 'நாளை',
    whenDays: '{{count}} நாட்களில்',
    reminderTitle: '{{title}} — {{when}}',
    eventReminderAt: 'இடம்: {{location}}',
    eventReminderDetails: 'விவரங்களைக் காண தட்டவும்.',
    anniversaryBody: 'ஒரு ஆண்டுவிழா நெருங்குகிறது.',
    celebrationBody: 'ஒரு குடும்பக் கொண்டாட்டம் நெருங்குகிறது.',
    birthdayTitle: '{{name}} அவர்களின் பிறந்தநாள் {{when}}',
    birthdayTurning: '{{age}} வயதாகிறது.',
    birthdayWish: 'வாழ்த்த மறக்காதீர்கள்.',
  },
};

const MEDIA_KEYS = { image: 'mediaImage', video: 'mediaVideo', audio: 'mediaAudio', document: 'mediaDocument' };

/** Substitute {{params}} once. Inserted values are never re-scanned. */
function fill(template, params) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] === undefined || params[key] === null ? '' : String(params[key]),
  );
}

const byKind = (p, photoKey, videoKey) => (p.kind === 'video' ? videoKey : photoKey);
const when = (p, t) => {
  if (p.days === 0) return t('whenToday');
  if (p.days === 1) return t('whenTomorrow');
  return t('whenDays', { count: p.days });
};
const chatPreview = (p, t) => p.preview || t(MEDIA_KEYS[p.mediaKind] || 'mediaImage');

const RENDERERS = {
  chat_message: (p, t) => ({ title: t('chatTitle'), body: chatPreview(p, t) }),
  chat_mention: (p, t) => ({ title: t('mentionTitle'), body: chatPreview(p, t) }),
  consent_requested: (p, t) => ({ title: t('consentRequestedTitle'), body: t('consentRequestedBody') }),
  consent_approved: (p, t) => ({ title: t('consentApprovedTitle'), body: t('consentApprovedBody') }),
  consent_rejected: (p, t) => ({ title: t('consentRejectedTitle'), body: t('consentRejectedBody') }),
  event_created: (p, t) => ({ title: t('eventCreatedTitle'), body: t('eventCreatedBody') }),
  event_comment: (p, t) => ({ title: t('eventCommentTitle'), body: t('commentBody') }),
  legacy_created: (p, t) => ({ title: t('legacyCreatedTitle'), body: t('legacyCreatedBody') }),
  legacy_tribute: (p, t) => ({ title: t('legacyTributeTitle'), body: t('legacyTributeBody') }),
  geofence_alert: (p, t) => {
    const entered = p.action === 'enter';
    if (p.name) {
      return {
        title: t(entered ? 'zoneArrivedTitle' : 'zoneLeftTitle'),
        body: t(entered ? 'zoneArrivedBody' : 'zoneLeftBody'),
      };
    }
    const place = p.place || t('placeUnknown');
    return { title: t('geofenceTitle'), body: t(entered ? 'placeArrivedBody' : 'placeLeftBody', { place }) };
  },
  sos_alert: (p, t) => ({ title: t('sosTitle'), body: p.message || t('sosBody') }),
  memory_review_requested: (p, t) => ({
    title: t('memoryReviewTitle'),
    body: t(byKind(p, 'memoryReviewPhotoBody', 'memoryReviewVideoBody')),
  }),
  memory_uploaded: (p, t) => ({ title: t('memoryNewTitle'), body: t(byKind(p, 'memoryNewPhotoBody', 'memoryNewVideoBody')) }),
  memory_approved: (p, t) => ({
    title: t('memoryApprovedTitle'),
    body: t(byKind(p, 'memoryApprovedPhotoBody', 'memoryApprovedVideoBody')),
  }),
  memory_rejected: (p, t) => ({
    title: t('memoryRejectedTitle'),
    body: [t(byKind(p, 'memoryRejectedPhotoBody', 'memoryRejectedVideoBody')), p.reason ? t('reasonSuffix') : '']
      .filter(Boolean)
      .join(' '),
  }),
  memory_comment: (p, t) => ({ title: t('memoryCommentTitle'), body: t('commentBody') }),
  story_created: (p, t) => ({ title: t('storyCreatedTitle'), body: p.title || '' }),
  event_reminder: (p, t) => ({
    title: t('reminderTitle', { when: when(p, t) }),
    body: p.location ? t('eventReminderAt') : t('eventReminderDetails'),
  }),
  celebration_reminder: (p, t) => ({
    title: t('reminderTitle', { when: when(p, t) }),
    body: t(p.celebrationType === 'anniversary' ? 'anniversaryBody' : 'celebrationBody'),
  }),
  birthday_reminder: (p, t) => ({
    title: t('birthdayTitle', { when: when(p, t) }),
    body: p.age ? t('birthdayTurning') : t('birthdayWish'),
  }),
};

/**
 * Render a notification for one recipient. Returns null when there is no
 * template for the type (or no params), so callers can keep their own text.
 */
function renderNotification(type, params, language) {
  const render = RENDERERS[type];
  if (!render || !params) return null;
  const strings = PHRASES[LANGUAGES.includes(language) ? language : 'en'];
  const t = (key, extra = {}) => fill(strings[key] ?? PHRASES.en[key], { ...params, ...extra });
  return render(params, t);
}

module.exports = { renderNotification, NOTIFICATION_TYPES: Object.keys(RENDERERS), LANGUAGES, PHRASES };
