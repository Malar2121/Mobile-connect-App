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

// t('a.b') or t("a.b") or t(`a.b`) — template keys with ${} are dynamic and skipped.
const T_CALL = /\bt\(\s*['"`]([A-Za-z0-9_.]+)['"`]/g;

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
    console.log(`      localised screens: ${localised.length}/${screens.length} (${pct}%)`);
    expect(localised.length).toBeGreaterThanOrEqual(18);
  });
});
