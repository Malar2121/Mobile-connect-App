const fs = require('fs');
const path = require('path');

/**
 * Catch mistakes that crash a screen or quietly break behaviour at runtime but
 * that neither Metro nor a parse check notices:
 *
 * - an identifier that is never defined, such as a component used without its
 *   import, or t() called at module level outside the component that obtains
 *   it (that one throws the moment the file is imported);
 * - a t() call whose `t` has been shadowed by an ordinary variable, such as
 *   `const t = title.trim()`;
 * - translated text used as data: a route name, or a value that is stored and
 *   compared, such as a relationship nickname. It only works in English, where
 *   "Calendar" happens to be both the label and the screen name.
 */
const MOBILE = path.join(__dirname, '../../../family-connect-mobile');
const parser = require(path.join(MOBILE, 'node_modules/@babel/parser'));
const traverse = require(path.join(MOBILE, 'node_modules/@babel/traverse')).default;

const PLUGINS = ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport', 'objectRestSpread'];

// Provided by the JavaScript engine or React Native rather than by an import.
const GLOBALS = new Set([
  'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask', 'Promise', 'JSON', 'Math', 'Date', 'Number',
  'String', 'Object', 'Array', 'Boolean', 'Symbol', 'RegExp', 'BigInt', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Reflect',
  'Proxy', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'Intl', 'ArrayBuffer', 'DataView', 'Uint8Array',
  'Uint16Array', 'Float32Array', 'fetch', 'FormData', 'Headers', 'Request', 'Response', 'URL', 'URLSearchParams',
  'AbortController', 'Blob', 'File', 'FileReader', 'TextEncoder', 'TextDecoder', 'WebSocket', 'XMLHttpRequest',
  'atob', 'btoa', 'alert', 'navigator', 'performance', 'structuredClone', 'encodeURIComponent', 'decodeURIComponent',
  'encodeURI', 'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'undefined', 'NaN', 'Infinity', 'arguments',
  'require', 'module', 'exports', 'global', 'globalThis', 'window', 'document', 'process', '__DEV__',
]);

// Keys whose values are identifiers or stored data, never text shown to people.
const DATA_KEYS = new Set([
  'screen', 'route', 'routeName', 'tab', 'id', 'key', 'value', 'type', 'backendType', 'relationshipType',
  'status', 'category', 'role', 'nickname',
]);
const NAV_CALLS = new Set(['navigate', 'push', 'replace', 'jumpTo']);

function sourceFiles() {
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  })(path.join(MOBILE, 'src'));
  for (const root of ['App.js', 'index.js']) {
    if (fs.existsSync(path.join(MOBILE, root))) files.push(path.join(MOBILE, root));
  }
  return files;
}

// `t` must come from a hook (const { t } = useI18n()), a parameter, or a function.
function isTranslator(binding) {
  if (binding.kind === 'param' || binding.kind === 'hoisted' || binding.kind === 'module') return true;
  if (!binding.path.isVariableDeclarator()) return false;
  const init = binding.path.node.init;
  if (!init) return false;
  if (init.type === 'CallExpression' && init.callee.type === 'Identifier') return /^use[A-Z]/.test(init.callee.name);
  return init.type === 'MemberExpression' || init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression' ||
    (init.type === 'Identifier' && init.name === 'translate');
}

const isTranslation = (node) =>
  node?.type === 'CallExpression' && node.callee.type === 'Identifier' && (node.callee.name === 't' || node.callee.name === 'translate');

const keyName = (node) => node.key.name || node.key.value;

function findScopeProblems(code, rel) {
  const problems = [];
  const report = (node, text) => problems.push(`${rel}:${node.loc.start.line} ${text}`);
  const ast = parser.parse(code, { sourceType: 'module', plugins: PLUGINS });

  traverse(ast, {
    ReferencedIdentifier(p) {
      const { name } = p.node;
      if (p.isJSXIdentifier() && /^[a-z]/.test(name)) return; // intrinsic JSX element names
      if (p.parentPath.isJSXClosingElement()) return; // already checked at the opening tag
      if (GLOBALS.has(name) || p.scope.hasBinding(name, true)) return;
      report(p.node, `"${name}" is not defined here`);
    },
    'CallExpression|OptionalCallExpression'(p) {
      const { callee } = p.node;
      if (callee.type === 'Identifier' && callee.name === 't') {
        const binding = p.scope.getBinding('t');
        if (binding && !isTranslator(binding)) report(p.node, 't() calls a variable that is not the translator');
      }
      const method = /MemberExpression$/.test(callee.type) ? callee.property.name : null;
      if (NAV_CALLS.has(method) && isTranslation(p.node.arguments[0])) {
        report(p.node, `${method}() is given translated text as a route name`);
      }
    },
    ObjectProperty(p) {
      if (DATA_KEYS.has(keyName(p.node)) && isTranslation(p.node.value)) {
        report(p.node, `"${keyName(p.node)}" is data but holds translated text`);
      }
    },
    ObjectMethod(p) {
      if (p.node.kind !== 'get' || !DATA_KEYS.has(keyName(p.node))) return;
      const ret = p.node.body.body.find((s) => s.type === 'ReturnStatement');
      if (isTranslation(ret?.argument)) report(p.node, `"${keyName(p.node)}" is data but holds translated text`);
    },
  });

  return problems;
}

describe('Mobile code only uses names and values that hold up at runtime', () => {
  it('recognises an undefined name, a module-level t() and a shadowed t', () => {
    const sample = [
      "import { useI18n } from './i18n';",
      "const OPTIONS = [{ id: 'a', label: t('x.a') }];",
      'export default function Sample({ title }) {',
      '  const { t } = useI18n();',
      '  function submit() {',
      '    const t = title.trim();',
      "    if (!t) alert(t('x.required'));",
      '  }',
      '  return <Card>{OPTIONS.length}</Card>;',
      '}',
    ].join('\n');
    expect(findScopeProblems(sample, 'sample.js')).toEqual([
      'sample.js:2 "t" is not defined here',
      'sample.js:7 t() calls a variable that is not the translator',
      'sample.js:9 "Card" is not defined here',
    ]);
  });

  it('recognises translated text used as a route name or stored value', () => {
    const sample = [
      "import { translate } from './i18n';",
      "const ACTIONS = [{ id: 'a', get screen() { return translate('x.a'); } }, { id: 'b', nickname: translate('x.b') }];",
      'export function open(navigation, t) {',
      "  navigation.getParent()?.navigate(t('tabs.events'));",
      '}',
    ].join('\n');
    const problems = findScopeProblems(sample, 'sample.js');
    expect(problems).toHaveLength(3);
    expect(problems).toEqual(expect.arrayContaining([
      'sample.js:2 "screen" is data but holds translated text',
      'sample.js:2 "nickname" is data but holds translated text',
      'sample.js:4 navigate() is given translated text as a route name',
    ]));
  });

  it('accepts t from the hook, a parameter or translate, and plain route names', () => {
    const sample = [
      "import { View, Text } from 'react-native';",
      "import { useI18n, translate } from './i18n';",
      'const roleName = (t, role) => t(`roles.${role}`);',
      "const OPTIONS = [{ id: 'a', get label() { return translate('x.a'); }, screen: 'Calendar' }];",
      'export default function Sample({ role, navigation }) {',
      '  const { t } = useI18n();',
      "  const open = () => navigation.navigate('Events');",
      "  return <View><Text onPress={open}>{t('x.title')}</Text><Text>{roleName(t, role)}{OPTIONS.length}</Text></View>;",
      '}',
    ].join('\n');
    expect(findScopeProblems(sample, 'sample.js')).toEqual([]);
  });

  it('has no undefined names, shadowed translators or translated data in the app', () => {
    const problems = [];
    for (const file of sourceFiles()) {
      const rel = path.relative(MOBILE, file).replace(/\\/g, '/');
      problems.push(...findScopeProblems(fs.readFileSync(file, 'utf8'), rel));
    }
    expect(problems).toEqual([]);
  });
});
