#!/usr/bin/env node
// Checks that every translatable string in index.html has an Arabic translation
// in assets/js/i18n.js, and that the dictionary has no leftovers.
// Usage: node tools/check-i18n.mjs   (Node 18+, no dependencies)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const html = readFileSync(fileURLToPath(new URL('index.html', root)), 'utf8');
const script = readFileSync(fileURLToPath(new URL('assets/js/i18n.js', root)), 'utf8');

const sandbox = { window: {} };
vm.runInNewContext(script, sandbox);
const { en = {}, ar = {} } = sandbox.window.TE_I18N || {};

const used = new Set();
for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(key);
for (const [, pairs] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
  for (const pair of pairs.split(';')) used.add(pair.split(':')[1].trim());
}
// strings that only exist in JavaScript
const dynamic = new Set(['meta.title', ...Object.keys(en)]);

const missing = [...used, ...dynamic].filter((key) => !(key in ar));
const unused = Object.keys(ar).filter((key) => !used.has(key) && !dynamic.has(key));

if (missing.length) console.error(`Missing Arabic translations (${missing.length}):\n  ${missing.join('\n  ')}`);
if (unused.length) console.error(`Unused Arabic keys (${unused.length}):\n  ${unused.join('\n  ')}`);
if (missing.length || unused.length) process.exit(1);
console.log(`i18n OK — ${used.size} keys in the page, ${Object.keys(ar).length} Arabic strings.`);
