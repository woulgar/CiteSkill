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
  assert.deepEqual(summarize(sample), { model: { Astra: 40, Gemma: 60 }, provider: { OpenAI: 40, Google: 60 }, agent: {}, workUnits: 1 });
});

test('renders a bounded README section and protects markdown table syntax', () => {
  const result = render(sample);
  assert.match(result, /user-declared estimates/);
  assert.match(result, /Useful plugin/);
  assert.match(result, /<!-- citeskill:end -->/);
});

test('parses commit trailer IDs', () => {
  assert.deepEqual(parseTrailer('Implement feature\n\nCiteSkill-Refs: astra-1, plugin-1\n'), ['astra-1', 'plugin-1']);
});
