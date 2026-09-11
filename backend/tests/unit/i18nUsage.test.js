const fs = require('fs');
const path = require('path');

/**
 * Every t('some.key') used anywhere in the app must exist in the English
 * bundle, and every screen that calls t() must actually obtain it from
 * useI18n(). Both failures are invisible in development — a missing key renders
 * as the raw key string, and a missing hook crashes only when that screen is
 * opened — so they are asserted here instead of being found during a demo.
 */
const MOBILE_SRC = path.join(__dirname, '../../../family-connect-mobile/src');
const EN = JSON.parse(fs.readFileSync(path.join(MOBILE_SRC, 'i18n/en.json'), 'utf8'));

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

function hasKey(dotted) {
  return dotted.split('.').reduce((node, part) => (node == null ? undefined : node[part]), EN) !== undefined;
}

const files = walk(MOBILE_SRC).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`));

// t('a.b') or translate('a.b') (quotes or backticks) — template keys with ${}
// are dynamic and skipped.
const T_CALL = /\b(?:t|translate)\(\s*['"`]([A-Za-z0-9_.]+)['"`]/g;

describe('i18n usage across the app', () => {
  const usages = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    T_CALL.lastIndex = 0;
    while ((m = T_CALL.exec(src))) {
      usages.push({ file: path.relative(MOBILE_SRC, file).replace(/\\/g, '/'), key: m[1] });
    }
  }

  it('finds translation usage to check', () => {
    expect(usages.length).toBeGreaterThan(100);
  });

  it('every translation key used in the app exists in the English bundle', () => {
    const missing = usages
      .filter((u) => !hasKey(u.key))
      .map((u) => `${u.file} -> ${u.key}`);
    expect(missing).toEqual([]);
  });

  it('every file that calls t() also obtains it from useI18n()', () => {
    const offenders = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      const callsT = /\bt\(\s*['"`][A-Za-z0-9_.]+['"`]/.test(src);
      if (!callsT) continue;
      // Valid ways to obtain t: destructure it from useI18n(), receive it as a
      // function parameter (helpers like getGreeting(t)), or take it as a prop.
      const obtainsT =
        /=\s*useI18n\(\)/.test(src) ||
        // a parameter list containing a bare `t`
        /\((?:[^()]*,\s*)?t\s*(?:,[^()]*)?\)\s*(?:=>|\{)/.test(src) ||
        // destructured from props: ({ t, ... })
        /\(\s*\{[^}]*\bt\b[^}]*\}\s*\)/.test(src);
      if (!obtainsT) offenders.push(path.relative(MOBILE_SRC, file).replace(/\\/g, '/'));
    }
    expect(offenders).toEqual([]);
  });

  it('reports how much of the app is localised', () => {
    const screens = files.filter((f) => f.includes(`${path.sep}screens${path.sep}`));
    const localised = screens.filter((f) => /useI18n/.test(fs.readFileSync(f, 'utf8')));
    const pct = Math.round((localised.length / screens.length) * 100);
    // Informational, and a floor so coverage cannot silently regress.
    // ChatScreen, FamilyDashboard and FamilyMapScreen only compose other
    // components and have no text of their own, so 82 is every screen with copy.
    console.log(`      localised screens: ${localised.length}/${screens.length} (${pct}%)`);
    expect(localised.length).toBeGreaterThanOrEqual(82);
  });

  describe('no hardcoded user-facing English', () => {
    /**
     * Every screen and component was migrated onto the i18n system, so any new
     * English literal in a UI position is a regression. This catches it at
     * build time rather than when a Sinhala or Tamil user opens the screen and
     * finds it in English.
     */
    const UI_PROPS = [
      'title', 'subtitle', 'label', 'placeholder', 'hint', 'description',
      'message', 'confirmLabel', 'cancelLabel', 'accessibilityLabel',
      'accessibilityHint', 'note',
    ];

    function stripComments(src) {
      return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .map((l) => (/^\s*\/\//.test(l) ? '' : l))
        .join('\n');
    }

    /** Prose, as opposed to an icon name, identifier, URL or code. */
    function looksLikeCopy(v) {
      const s = v.trim();
      if (s.length < 3) return false;
      if (!/[a-z]/.test(s)) return false;
      if (/^(https?:|\/|#|\d)/.test(s)) return false;
      if (/^[A-Z]{2,}-[A-Z0-9]{2,}$/.test(s)) return false;
      if (/^\d{4}-\d{2}/.test(s)) return false;
      if (/^[a-z]+(-[a-z]+)*$/.test(s)) return false; // ionicon names
      if (/^[a-z0-9_.-]+$/i.test(s) && !/\s/.test(s)) return false;
      return /\s/.test(s) || /^[A-Z]/.test(s);
    }

    const uiFiles = files.filter(
      (f) =>
        f.includes(`${path.sep}screens${path.sep}`) ||
        f.includes(`${path.sep}components${path.sep}`),
    );

    it('has no English literals left in UI props or JSX text', () => {
      const offenders = [];

      for (const file of uiFiles) {
        const src = stripComments(fs.readFileSync(file, 'utf8'));
        const found = new Set();

        for (const prop of UI_PROPS) {
          const re = new RegExp(`\\b${prop}\\s*=\\s*(?:"([^"]{3,})"|'([^']{3,})')`, 'g');
          let m;
          while ((m = re.exec(src))) {
            const v = m[1] ?? m[2];
            if (looksLikeCopy(v)) found.add(v);
          }
        }

        const jsxText = /> *([A-Za-z][A-Za-z0-9 ,.'!?&:%()–—-]{3,}?) *</g;
        let m;
        while ((m = jsxText.exec(src))) {
          if (looksLikeCopy(m[1])) found.add(m[1].trim());
        }

        if (found.size > 0) {
          offenders.push(`${path.relative(MOBILE_SRC, file).replace(/\\/g, '/')}: ${[...found].join(' | ')}`);
        }
      }

      expect(offenders).toEqual([]);
    });
  });
});
