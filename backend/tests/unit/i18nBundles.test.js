const fs = require('fs');
const path = require('path');

/**
 * Proposal Objective 6 requires English, Sinhala and Tamil. A missing key does
 * not crash the app — it silently falls back to English or renders the raw key
 * — so bundle drift is exactly the kind of defect that survives manual testing.
 * These assertions fail the build instead.
 */
const I18N_DIR = path.join(__dirname, '../../../family-connect-mobile/src/i18n');
const LOCALES = ['en', 'ta', 'si'];

const load = (locale) => JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${locale}.json`), 'utf8'));

function leafKeys(obj, prefix = '', acc = []) {
  Object.entries(obj).forEach(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') leafKeys(value, full, acc);
    else acc.push(full);
  });
  return acc;
}

function placeholders(str) {
  return (String(str).match(/\{\{(\w+)\}\}/g) ?? []).sort();
}

describe('Translation bundles (proposal Objective 6)', () => {
  const bundles = Object.fromEntries(LOCALES.map((l) => [l, load(l)]));
  const keys = Object.fromEntries(LOCALES.map((l) => [l, leafKeys(bundles[l])]));

  it.each(LOCALES)('%s bundle is valid JSON with keys', (locale) => {
    expect(keys[locale].length).toBeGreaterThan(0);
  });

  it.each(['ta', 'si'])('%s has every key English has', (locale) => {
    const missing = keys.en.filter((k) => !keys[locale].includes(k));
    expect(missing).toEqual([]);
  });

  it.each(['ta', 'si'])('%s has no keys English lacks', (locale) => {
    const extra = keys[locale].filter((k) => !keys.en.includes(k));
    expect(extra).toEqual([]);
  });

  it.each(['ta', 'si'])('%s uses the same interpolation placeholders as English', (locale) => {
    const get = (obj, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
    const mismatched = keys.en.filter((k) => {
      const en = get(bundles.en, k);
      const other = get(bundles[locale], k);
      if (typeof en !== 'string' || typeof other !== 'string') return false;
      return JSON.stringify(placeholders(en)) !== JSON.stringify(placeholders(other));
    });
    expect(mismatched).toEqual([]);
  });

  it.each(['ta', 'si'])('%s is actually translated, not copied English', (locale) => {
    const get = (obj, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
    // Some values legitimately match across languages (proper nouns, "SOS",
    // date formats). Assert that the great majority differ, not every one.
    const strings = keys.en.filter((k) => typeof get(bundles.en, k) === 'string');
    const identical = strings.filter((k) => get(bundles.en, k) === get(bundles[locale], k));
    expect(identical.length / strings.length).toBeLessThan(0.25);
  });

  it.each(['ta', 'si'])('%s contains its own script', (locale) => {
    const script = locale === 'ta' ? /[஀-௿]/ : /[඀-෿]/;
    const text = JSON.stringify(bundles[locale]);
    expect(script.test(text)).toBe(true);
  });

  it('has no empty translation values in any locale', () => {
    const get = (obj, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
    for (const locale of LOCALES) {
      const empties = keys[locale].filter((k) => {
        const v = get(bundles[locale], k);
        return typeof v === 'string' && v.trim() === '';
      });
      expect(empties).toEqual([]);
    }
  });
});
