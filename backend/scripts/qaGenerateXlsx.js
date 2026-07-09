/*
 * Generates docs/qa/TEST_CASES.xlsx (+ .csv) from the live API/socket results
 * plus curated static/manual test cases. Zero external dependencies — writes a
 * valid (stored/uncompressed) .xlsx zip by hand.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const qaDir = path.join(__dirname, '..', '..', 'docs', 'qa');
const api = JSON.parse(fs.readFileSync(path.join(qaDir, 'api-results.json'), 'utf8'));
let socket = { results: [] };
try { socket = JSON.parse(fs.readFileSync(path.join(qaDir, 'socket-results.json'), 'utf8')); } catch {}

// ── Assemble unified test-case rows ──
let n = 0;
const rows = [];
const add = (phase, module, name, method, expected, actual, status, notes = '') => {
  n += 1;
  rows.push({
    id: `TC-${String(n).padStart(3, '0')}`,
    phase, module, name,
    type: method, expected, actual, status, notes,
  });
};

// API (live) results
api.results.forEach((r) => {
  add('API/Integration', r.phase, r.name, 'Automated (live HTTP)', 'See case name', r.detail || '', r.status, 'Executed against running server + MongoDB');
});
// Socket (live) results
socket.results.forEach((r) => {
  add('Realtime', 'Chat/Socket', r.name, 'Automated (socket.io)', 'See case name', r.detail || '', r.status, 'Executed against live Socket.io server');
});

// Curated static/manual cases (code-verified) — Phases 2, 9, 10, 11, 14, Nav, Regression
const M = [
  // Phase 2 Dashboard (static)
  ['Static', 'Dashboard', 'Greeting renders with user/family name', 'PASS', 'GreetingSection wired in DashboardScreen'],
  ['Static', 'Dashboard', 'Statistics cards render (TodaysSummary/Insights)', 'PASS', 'TodaysSummary + InsightsSection'],
  ['Static', 'Dashboard', 'Quick actions grid navigates to modules', 'PASS', 'QuickActionsGrid handlers'],
  ['Static', 'Dashboard', 'Loading skeleton state', 'PASS', 'sectionLoading skeleton'],
  ['Static', 'Dashboard', 'Error state surfaced', 'PASS', 'sectionError rendered'],
  ['Static', 'Dashboard', 'Pull-to-refresh', 'PASS', 'RefreshControl + refresh()'],
  ['Static', 'Dashboard', 'Empty state (family exists but empty sections)', 'PARTIAL', 'Empty only for no-family; BUG-L3'],
  ['Static', 'Dashboard', 'Responsive layout (useResponsive/uiMode)', 'PASS', 'horizontalPadding + layout scale'],
  // Phase 9 Accessibility & i18n
  ['Static', 'Accessibility', 'English locale bundle complete', 'PASS', 'en.json ~158 keys'],
  ['Static', 'Accessibility', 'Tamil locale bundle translated', 'PASS', 'ta.json ~158 keys'],
  ['Static', 'Accessibility', 'Sinhala locale bundle translated', 'PASS', 'si.json ~158 keys'],
  ['Static', 'Accessibility', 'Minor Mode gating', 'PASS', 'UIModeContext + accessibilityPolicy'],
  ['Static', 'Accessibility', 'Standard Mode', 'PASS', 'UIModeContext default'],
  ['Static', 'Accessibility', 'Elder Mode (scale/simplified)', 'PASS', 'uiModeLayout.elder presets'],
  ['Static', 'Accessibility', 'High Contrast theme', 'PASS', 'themePreference highContrast'],
  ['Static', 'Accessibility', 'Reduced Motion honored', 'PASS', 'useMotion + reducedMotion flag'],
  ['Static', 'Accessibility', 'VoiceOver labels on tab bar / SOS / CTAs', 'PARTIAL', '~94 labels; not exhaustive (BUG-L4)'],
  ['Static', 'Accessibility', 'Touch targets meet min size per mode', 'PASS', 'minTouch in spacing presets'],
  ['Static', 'Accessibility', 'Feature-screen i18n adoption (events/memories/chat/map)', 'FAIL', 'Hardcoded English strings; BUG-M4'],
  // Phase 10 Offline
  ['Static', 'Offline', 'Offline banner shown when disconnected', 'PASS', 'OfflineBanner in AppNavigator'],
  ['Static', 'Offline', 'Health-ping + reconnect detection', 'PASS', 'NetworkContext pingHealth interval/foreground'],
  ['Static', 'Offline', 'Cached read data remains visible', 'PARTIAL', 'In-memory only; dashboard partial catch'],
  ['Static', 'Offline', 'API failure handled (axios interceptor)', 'PASS', 'api.js network-error normalization'],
  ['Static', 'Offline', 'Retry queue processes mutations on reconnect', 'FAIL', 'No processors registered; dead code (BUG-M2)'],
  ['Static', 'Offline', 'Airplane-mode mutation queued for retry', 'FAIL', 'enqueueOfflineRequest never called (BUG-M2)'],
  // Phase 11 Notifications (client)
  ['Static', 'Notifications', 'Foreground notification handler', 'PASS', 'setNotificationHandler'],
  ['Static', 'Notifications', 'Notification tap deep-link routing', 'PASS', 'handleNotificationNavigation + navigationRef'],
  ['Static', 'Notifications', 'Permission request/denied handling', 'PASS', 'get/requestPermissionsAsync'],
  ['Static', 'Notifications', 'Android channel registered', 'PASS', 'family_connect_main channel'],
  ['Static', 'Notifications', 'Listener cleanup on unmount', 'PASS', 'responseSub.remove()'],
  ['Static', 'Notifications', 'Expo Go Android push skipped safely', 'PASS', 'isPushAvailable guard'],
  // Phase 14 Build
  ['Build', 'Android', 'android.package (applicationId) set', 'PASS', 'com.familyconnect.mobile'],
  ['Build', 'Android', 'android.versionCode set', 'PASS', 'versionCode 1'],
  ['Build', 'Android', 'CAMERA permission declared', 'PASS', 'permissions:[CAMERA] + plugins'],
  ['Build', 'Android', 'App icon + adaptive icon present', 'PASS', 'assets/icon.png, adaptive-icon.png'],
  ['Build', 'Android', 'Splash screen configured', 'PARTIAL', 'Splash asset duplicates adaptive icon (cosmetic)'],
  ['Build', 'Android', 'Custom fonts (Inter) bundled', 'PASS', 'expo-font + useFonts'],
  ['Build', 'Android', 'Debug build installable (prebuild succeeds)', 'PASS', 'expo prebuild verified'],
  ['Build', 'Android', 'Release build Play-valid (production keystore)', 'FAIL', 'Debug-signed fallback; keystore required (BUG-M5)'],
  ['Build', 'Android', 'app.json version aligns with package.json', 'FAIL', '1.0.0 vs 1.0.0-rc.3 (BUG-L2)'],
  // Navigation
  ['Static', 'Navigation', 'All 9 navigators register their screens', 'PASS', 'Route inventory verified'],
  ['Static', 'Navigation', 'Notification deep-link targets resolve', 'PASS', 'Whitelisted routes'],
  ['Static', 'Navigation', 'Leave-family navigates to ProfileMain via parent', 'PASS', 'Fixed to getParent().navigate (BUG-M3)'],
  // Regression (code-verified)
  ['Regression', 'Memories', 'Gallery opens without TDZ crash', 'PASS', 'policy declared before use'],
  ['Regression', 'Map', 'SOS countdown decrements + sends + cancel aborts', 'PASS', 'SOSScreen effect + confirmSOS'],
  ['Regression', 'Chat', 'Incoming socket msg does NOT refetch history', 'PASS', 'upsertMessage; deps exclude messages.length'],
  ['Regression', 'Map', 'location_update updates single member in place', 'PASS', 'upsertLocationInMap'],
  ['Regression', 'Memories', 'Like null-safe while profile hydrating', 'PASS', 'user?._id guard'],
  ['Regression', 'Chat', 'Search with regex metacharacters no 500', 'PASS', 'escapeRegex (also live-tested)'],
  ['Regression', 'FamilyTree', 'Tree populated for real (non-seeded) family', 'PASS', 'FamilyMember created on create/join (BUG-C/H1 fix)'],
  ['Regression', 'Notifications', '/create restricted to admin', 'PASS', 'admin role guard (BUG-H2 fix)'],
];
M.forEach(([phase, module, name, status, notes]) =>
  add(phase, module, name, 'Static/code review', 'See case name', status === 'PASS' ? 'As expected' : notes, status, notes));

// ── Write CSV ──
const headers = ['Test ID', 'Phase', 'Module', 'Test Case', 'Type', 'Expected', 'Actual/Detail', 'Status', 'Notes'];
const esc = (s) => {
  const v = String(s ?? '');
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};
const csv = [headers.join(',')]
  .concat(rows.map((r) => [r.id, r.phase, r.module, r.name, r.type, r.expected, r.actual, r.status, r.notes].map(esc).join(',')))
  .join('\r\n');
fs.writeFileSync(path.join(qaDir, 'TEST_CASES.csv'), csv, 'utf8');

// ── Write real .xlsx (zip of Open XML parts) ──
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let i = 0; i < 256; i++) {
      c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function xmlEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function colRef(idx) {
  let s = '';
  idx += 1;
  while (idx > 0) { const m = (idx - 1) % 26; s = String.fromCharCode(65 + m) + s; idx = Math.floor((idx - 1) / 26); }
  return s;
}

function sheetXml() {
  const allRows = [headers].concat(rows.map((r) => [r.id, r.phase, r.module, r.name, r.type, r.expected, r.actual, r.status, r.notes]));
  const body = allRows.map((cells, ri) => {
    const c = cells.map((val, ci) => {
      const ref = `${colRef(ci)}${ri + 1}`;
      const styleAttr = ri === 0 ? ' s="1"' : '';
      return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
    }).join('');
    return `<row r="${ri + 1}">${c}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

const parts = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Test Cases" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
  'xl/worksheets/sheet1.xml': sheetXml(),
};

// Build ZIP (stored)
const chunks = [];
const central = [];
let offset = 0;
const encoder = (s) => Buffer.from(s, 'utf8');
for (const [name, content] of Object.entries(parts)) {
  const data = Buffer.isBuffer(content) ? content : encoder(content);
  const crc = crc32(data);
  const nameBuf = encoder(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8); // stored
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  chunks.push(local, nameBuf, data);

  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 8);
  cd.writeUInt16LE(0, 10);
  cd.writeUInt16LE(0, 12);
  cd.writeUInt16LE(0, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(data.length, 20);
  cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(nameBuf.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt16LE(0, 36);
  cd.writeUInt32LE(0, 38);
  cd.writeUInt32LE(offset, 42);
  central.push(Buffer.concat([cd, nameBuf]));
  offset += local.length + nameBuf.length + data.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(Object.keys(parts).length, 8);
end.writeUInt16LE(Object.keys(parts).length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(0, 20);
const zip = Buffer.concat([...chunks, centralBuf, end]);
fs.writeFileSync(path.join(qaDir, 'TEST_CASES.xlsx'), zip);

const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
console.log(`Wrote ${rows.length} test cases to TEST_CASES.xlsx + TEST_CASES.csv`);
console.log('Status counts:', JSON.stringify(counts));
void zlib; // reserved (stored method used)
