const fs = require('fs');
const path = require('path');

/**
 * Guard against hardcoded English in the mobile interface (proposal §6.3:
 * English, Sinhala and Tamil). Every user-facing string must come from the
 * translation bundles, so a Sinhala or Tamil screen never shows an English
 * fragment.
 *
 * Only files the app actually loads (reachable from index.js) are checked.
 * Developer-only error messages (`new Error(...)`) are not user-facing and
 * are not flagged.
 */
const MOBILE = path.join(__dirname, '../../../family-connect-mobile');
const SRC = path.join(MOBILE, 'src');
const parser = require(path.join(MOBILE, 'node_modules/@babel/parser'));

const PLUGINS = ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport', 'objectRestSpread'];
const SKIP_KEYS = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments']);

// Props and object keys whose string values are shown to people.
const USER_PROPS = new Set([
  'title', 'label', 'placeholder', 'subtitle', 'message', 'description', 'accessibilityLabel',
  'accessibilityHint', 'emptyText', 'emptyTitle', 'emptyDescription', 'buttonText', 'confirmText',
  'cancelText', 'text', 'header', 'headerTitle', 'tabBarLabel', 'helperText', 'hint', 'caption',
  'actionLabel', 'confirmLabel', 'cancelLabel', 'error', 'value',
]);
const USER_KEYS = new Set([
  'label', 'title', 'subtitle', 'description', 'message', 'placeholder', 'text', 'body', 'hint',
  'caption', 'emptyText', 'heading', 'actionLabel', 'confirmText', 'cancelText', 'confirmLabel', 'cancelLabel',
]);
const USER_CALLS = /^(Alert\.alert|Alert\.prompt|toast\.(success|error|info|warning|show)|Share\.share|Speech\.speak)$/;

// Language-neutral strings that are allowed to appear literally.
const ALLOWED = new Set(['ABCD-EFGH', 'YYYY-MM-DD', 'SOS', 'QR', 'PDF', 'GIF', 'OK', 'ETA', 'Family Connect']);

// A template piece with a word beside a space is prose, e.g. `${n} items`.
const PROSE_PIECE = /\s[A-Za-z]{2,}|[A-Za-z]{2,}\s/;

function resolveImport(from, spec) {
  if (typeof spec !== 'string' || !spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    // Only JavaScript is scanned; bundles, images and fonts are also required.
    if (candidate.endsWith('.js') && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function each(node, visit, parents = []) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parents);
  parents.push(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) value.forEach((child) => each(child, visit, parents));
    else if (value && typeof value.type === 'string') each(value, visit, parents);
  }
  parents.pop();
}

const calleeName = (c) => {
  if (!c) return '';
  if (c.type === 'Identifier') return c.name;
  if (c.type === 'MemberExpression') return `${calleeName(c.object)}.${c.property.name || ''}`;
  return '';
};

// Plain words, not identifiers, icon names, colours or storage keys.
function looksLikeWords(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z]{2,}/.test(t) || ALLOWED.has(t)) return false;
  if (/^[a-z0-9]+([-_.][a-z0-9]+)*$/i.test(t) && !/\s/.test(t) && !/^[A-Z][a-z]+$/.test(t)) return false;
  if (/^[a-z]+[A-Z]\w*$/.test(t) || /^#|^rgba?\(|^https?:|^\//.test(t)) return false;
  // Example email addresses are written in Latin letters in every language.
  if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t)) return false;
  return true;
}

function collectReachable() {
  const entry = path.join(MOBILE, 'index.js');
  const seen = new Set();
  const queue = [entry];
  const asts = new Map();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: PLUGINS });
    asts.set(file, ast);
    each(ast.program, (n) => {
      const spec =
        (/^(ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration)$/.test(n.type) && n.source?.value) ||
        (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'require' && n.arguments[0]?.value);
      const resolved = resolveImport(file, spec);
      if (resolved) queue.push(resolved);
    });
  }
  return asts;
}

function findViolations(ast, rel) {
  const violations = [];

  each(ast.program, (node, parents) => {
    const report = (text) => violations.push(`${rel}:${node.loc.start.line} "${text.replace(/\s+/g, ' ').trim().slice(0, 60)}"`);

    if (node.type === 'JSXText') {
      if (looksLikeWords(node.value)) report(node.value);
      return;
    }

    // Template literals count too: `${n} items` is as English as 'items'.
    let text;
    let words;
    if (node.type === 'StringLiteral') {
      text = node.value;
      words = looksLikeWords(text);
    } else if (node.type === 'TemplateLiteral') {
      const pieces = node.quasis.map((q) => q.value.cooked ?? q.value.raw);
      text = pieces.join(' ');
      words = looksLikeWords(text) || pieces.some((piece) => PROSE_PIECE.test(piece));
    } else {
      return;
    }
    if (!words) return;
    if (parents.some((p) => p.type === 'NewExpression' && calleeName(p.callee) === 'Error')) return;

    // Walk up through wrappers such as `cond ? 'a' : 'b'` and `a || 'b'`.
    let i = parents.length - 1;
    let child = node;
    while (i >= 0 && /^(ConditionalExpression|LogicalExpression|JSXExpressionContainer)$/.test(parents[i].type)) {
      if (parents[i].type === 'ConditionalExpression' && parents[i].test === child) return;
      if (parents[i].type === 'JSXExpressionContainer' && /^JSX(Element|Fragment)$/.test(parents[i - 1]?.type)) {
        report(text);
        return;
      }
      child = parents[i];
      i -= 1;
    }
    const holder = parents[i];
    if (!holder) return;
    if (holder.type === 'JSXAttribute' && USER_PROPS.has(holder.name.name)) report(text);
    else if (holder.type === 'ObjectProperty' && holder.value === child && USER_KEYS.has(holder.key.name || holder.key.value)) report(text);
    else if (holder.type === 'CallExpression' && USER_CALLS.test(calleeName(holder.callee))) report(text);
  });

  return violations;
}

describe('No hardcoded user-facing English in the mobile app', () => {
  const asts = collectReachable();
  const parse = (lines) => parser.parse(lines.join('\n'), { sourceType: 'module', plugins: PLUGINS });

  it('checks the files the app actually loads', () => {
    expect(asts.size).toBeGreaterThan(200);
  });

  it('recognises hardcoded English when it is there', () => {
    const sample = parse([
      'export default function Sample({ n }) {',
      "  Alert.alert('Saved', 'All done');",
      '  return (',
      '    <View>',
      '      <Text>Welcome home</Text>',
      '      <Input placeholder="Your name" />',
      '      <Text>{`${n} items`}</Text>',
      '    </View>',
      '  );',
      '}',
    ]);
    expect(findViolations(sample, 'sample.js')).toHaveLength(5);
  });

  it('leaves translated, technical and developer-only strings alone', () => {
    const sample = parse([
      'export default function Sample({ id }) {',
      "  if (!id) throw new Error('Sample needs an id');",
      '  return (',
      '    <View>',
      '      <Ionicons name="home-outline" />',
      "      <Text>{t('auth.email')}</Text>",
      '      <Input placeholder="you@example.com" />',
      '      <Text style={{ width: `${id}px` }}>{id}</Text>',
      '    </View>',
      '  );',
      '}',
    ]);
    expect(findViolations(sample, 'sample.js')).toEqual([]);
  });

  it('keeps every user-facing string in the translation bundles', () => {
    const violations = [];
    for (const [file, ast] of asts) {
      if (file.startsWith(path.join(SRC, 'i18n'))) continue;
      violations.push(...findViolations(ast, path.relative(MOBILE, file).replace(/\\/g, '/')));
    }
    expect(violations).toEqual([]);
  });
});
