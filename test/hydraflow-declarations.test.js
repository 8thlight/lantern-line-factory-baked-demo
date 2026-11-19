import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const charter = readFileSync(new URL('../.hydraflow/charter.yaml', import.meta.url), 'utf8').split('\n');
const layout = readFileSync(new URL('../.hydraflow/layout.yaml', import.meta.url), 'utf8').split('\n');

const STANDARDS = [
  'ports_and_adapters',
  'domain_entities',
  'adr_enforcement',
  'ci_is_configured',
  'hygiene',
  'testing',
  'ubiquitous_language',
  'code_craft',
  'fail_closed',
  'no_second_copy',
  'line_contract',
];

// The lines of a top-level block: those after `name:` up to the next top-level key.
function topLevelBlock(lines, name) {
  const start = lines.indexOf(`${name}:`);
  assert.notEqual(start, -1, `no top-level ${name}:`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^\S/.test(line));
  return end === -1 ? rest : rest.slice(0, end);
}

test('the charter states the product purpose', () => {
  assert.ok(charter.includes('  product: Lantern Line, a small browser tower-defence game'));
});

test('the charter inherits the kernel', () => {
  assert.ok(charter.includes('inherits: kernel'));
});

test('the charter holds the line to the eleven product standards, in order', () => {
  const articles = topLevelBlock(charter, 'articles');
  const start = articles.indexOf('  standards:');
  assert.notEqual(start, -1, 'no standards under articles:');
  const names = [];
  for (const line of articles.slice(start + 1)) {
    const item = /^ {2}- (\S+)$/.exec(line);
    if (!item) break;
    names.push(item[1]);
  }
  assert.deepEqual(names, STANDARDS);
});

test('the layout names the same eleven standards', () => {
  const names = topLevelBlock(layout, 'standards')
    .map((line) => /^ {2}(\w+):/.exec(line))
    .filter(Boolean)
    .map((match) => match[1]);
  assert.deepEqual(names.sort(), [...STANDARDS].sort());
});

test('the layout keeps its unit and scenario rings under test/', () => {
  const rings = topLevelBlock(layout, 'rings');
  for (const ring of ['unit', 'scenario']) {
    const line = rings.find((l) => l.startsWith(`  ${ring}: `));
    assert.ok(line, `no ${ring} ring`);
    assert.match(line, new RegExp(`^  ${ring}: test/`));
  }
});
