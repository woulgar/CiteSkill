import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, summarize, render, parseTrailer, type Manifest } from './core.js';

const sample: Manifest = { schemaVersion: 1, entries: [
  { id: 'astra-1', kind: 'model', name: 'Astra', model: 'Astra', provider: 'OpenAI', estimatedShare: 40, ref: { type: 'commit', value: 'abcdef1234567' } },
  { id: 'gemma-1', kind: 'model', name: 'Gemma', model: 'Gemma', provider: 'Google', estimatedShare: 60, ref: { type: 'commit', value: 'abcdef1234567' } },
  { id: 'plugin-1', kind: 'plugin', name: 'Useful plugin', ref: { type: 'commit', value: 'abcdef1234567' }, url: 'https://example.com/plugin' }
] };

test('validates a direct citation manifest and rejects invalid shares', () => {
  assert.deepEqual(validate(sample), []);
  const bad = structuredClone(sample);
  bad.entries[1].estimatedShare = 70;
  assert.match(validate(bad).join(' '), /exceed 100/);
});

test('aggregates model and provider shares without combining their totals', () => {
  const summary = summarize(sample);
  assert.deepEqual({ ...summary.model }, { Astra: 40, Gemma: 60 });
  assert.deepEqual({ ...summary.provider }, { OpenAI: 40, Google: 60 });
  assert.deepEqual({ ...summary.agent }, {});
  assert.equal(summary.workUnits, 1);
});

test('handles reserved names and strips Markdown syntax from summaries', () => {
  const manifest: Manifest = { schemaVersion: 1, entries: [
    { id: 'reserved-1', kind: 'model', name: 'reserved', model: '__proto__', provider: 'constructor', estimatedShare: 50, ref: { type: 'commit', value: 'abcdef1234567' } },
    { id: 'unsafe-1', kind: 'model', name: 'unsafe', model: '[click](https://example.com)', provider: '`provider`', estimatedShare: 50, ref: { type: 'commit', value: 'abcdef1234567' } }
  ] };
  const summary = summarize(manifest);
  assert.equal(summary.model.__proto__, 50);
  assert.equal(summary.provider.constructor, 50);
  const output = render(manifest);
  assert.doesNotMatch(output, /\*\*Estimated model shares:\*\*[^\n]*\[click\]/);
  assert.doesNotMatch(output, /\*\*Estimated provider shares:\*\*[^\n]*`provider`/);
});

test('renders a bounded README section and protects markdown table syntax', () => {
  const result = render(sample);
  assert.match(result, /user-declared estimates/);
  assert.match(result, /Useful plugin/);
  assert.match(result, /<!-- citeskill:end -->/);
});

test('rejects unsafe URLs and escapes citation labels in generated Markdown', () => {
  const bad = structuredClone(sample);
  bad.entries[2].url = 'javascript:alert(1)';
  assert.match(validate(bad).join(' '), /HTTPS URL/);
  bad.entries[2].url = 'https://example.com/x_(y)';
  bad.entries[2].name = 'Useful | [plugin]';
  const result = render(bad);
  assert.match(result, /Useful\s+plugin/);
  assert.match(result, /x_%28y%29/);
});

test('parses commit trailer IDs', () => {
  assert.deepEqual(parseTrailer('Implement feature\n\nCiteSkill-Refs: astra-1, plugin-1\n'), ['astra-1', 'plugin-1']);
});
