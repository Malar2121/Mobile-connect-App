const fs = require('fs');
const path = require('path');

/**
 * Navigation reachability and UI cleanliness.
 *
 * These guard three defects found in the UI/UX audit that no runtime test would
 * have caught, because each was "working code" that simply led nowhere:
 *
 *   - Elder Mode registered no Events/Memories/FamilyTree route while a comment
 *     claimed they were reachable, so elders could not open the celebration
 *     calendar or memory archive at all.
 *   - Child Mode had no Profile tab, so a minor could not change language.
 *   - Eleven developer TODOs rendered in the live UI, some of them false.
 */
const MOBILE_SRC = path.join(__dirname, '../../../family-connect-mobile/src');
const read = (rel) => fs.readFileSync(path.join(MOBILE_SRC, rel), 'utf8');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

describe('Elder Mode navigation', () => {
  const nav = read('navigation/ElderTabNavigator.js');
  const dash = read('screens/dashboard/ElderDashboardScreen.js');

  it.each(['EventsModule', 'MemoriesModule', 'FamilyTreeModule', 'FamilyModule'])(
    'registers %s in the elder profile stack',
    (route) => {
      expect(nav).toMatch(new RegExp(`name="${route}"`));
    },
  );

  it('keeps the tab bar at four large targets', () => {
    const tabs = nav.match(/<Tab\.Screen\s+name="/g) ?? [];
    expect(tabs).toHaveLength(4);
  });

  it.each([
    ['EventsModule', 'EventsHome'],
    ['EventsModule', 'Celebrations'],
    ['MemoriesModule', 'MemoriesHome'],
    ['FamilyTreeModule', 'FamilyTreeHome'],
  ])('gives the elder dashboard a route into %s → %s', (module, screen) => {
    expect(dash).toContain(`screen: '${module}', params: { screen: '${screen}' }`);
  });

  it('no longer claims reachability it does not provide', () => {
    expect(nav).not.toMatch(/remain reachable through the profile hub/);
  });

  it('does not change the elder density model', () => {
    const spacing = read('design-system/tokens/spacing.js');
    expect(spacing).toContain('fontScale: 1.24');
    expect(spacing).toContain('minTouch: 60');
  });
});

describe('Child Mode navigation', () => {
  const nav = read('navigation/ChildTabNavigator.js');

  it('has a Profile tab', () => {
    expect(nav).toContain('name="Profile"');
  });

  it.each(['ProfileMain', 'Language', 'Security', 'Notifications', 'JoinFamily'])(
    'gives a minor access to %s',
    (route) => {
      expect(nav).toMatch(new RegExp(`name="${route}"`));
    },
  );

  it.each(['FamilyModule', 'FamilyTreeModule', 'CreateFamily'])(
    'never routes a minor to %s',
    (route) => {
      expect(nav).not.toMatch(new RegExp(`name="${route}"`));
    },
  );
});

describe('Child consent explanation', () => {
  const child = read('screens/dashboard/ChildDashboardScreen.js');
  const standard = read('screens/dashboard/DashboardScreen.js');

  it('shows the consent banner on the dashboard a minor actually sees', () => {
    expect(child).toContain('<ConsentBanner />');
    expect(child).toMatch(/import \{ ConsentBanner \}/);
  });

  it('still shows it on the standard dashboard', () => {
    expect(standard).toContain('<ConsentBanner />');
  });

  it('reuses the one consent component rather than a second system', () => {
    const banners = walk(MOBILE_SRC).filter((f) => /ConsentBanner\.js$/.test(f));
    expect(banners).toHaveLength(1);
  });

  it('does not let the banner offer self-approval', () => {
    const banner = read('components/family/ConsentBanner.js');
    expect(banner).not.toMatch(/approveConsent|rejectConsent/);
  });
});

describe('no developer notes reach the user', () => {
  const uiFiles = walk(MOBILE_SRC).filter(
    (f) => f.includes(`${path.sep}screens${path.sep}`) || f.includes(`${path.sep}components${path.sep}`),
  );

  /** Strip comments so genuine developer notes are not flagged. */
  function visibleText(src) {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
  }

  const FORBIDDEN = [/\bTODO\b/, /\bFIXME\b/, /Coming soon/i, /requires a backend/i, /not yet available/i];

  it.each(FORBIDDEN.map((r) => [r.source, r]))('no user-facing "%s"', (_label, pattern) => {
    const offenders = uiFiles
      .filter((f) => pattern.test(visibleText(fs.readFileSync(f, 'utf8'))))
      .map((f) => path.relative(MOBILE_SRC, f).replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });
});
