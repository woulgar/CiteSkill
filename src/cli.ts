#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { init, load, save, render, parseTrailer, summarize, type Entry, type Kind, KINDS } from './core.js';

function usage(): never {
  throw new Error('Usage: citeskill <init|add|validate|render|commit-link|summary> [options]. See README.md.');
}
function options(args: string[], allowed: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith('--') || !args[i + 1] || args[i + 1].startsWith('--')) usage();
    const key = args[i].slice(2);
    if (!allowed.includes(key)) throw new Error(`Unknown option: --${key}.`);
    if (out[key] !== undefined) throw new Error(`Repeated option: --${key}.`);
    out[key] = args[i + 1];
  }
  return out;
}
function required(opts: Record<string, string>, key: string): string {
  if (!opts[key]) throw new Error(`Missing --${key}.`);
  return opts[key];
}
function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}
function main(): void {
  const [command, ...args] = process.argv.slice(2);
  const root = process.cwd();
  if (command === '--help' || command === 'help' || command === '-h') {
    console.log('CiteSkill commands: init; add --id ID --kind KIND --name NAME --ref-type commit|pr [--ref SHA|NUMBER] [--url URL] [--provider NAME] [--model NAME] [--share 0..100] [--evidence-url URL]; validate [--trailers]; render [--output PATH]; commit-link --ids ID,ID; summary');
    return;
  }
  if (command === 'init') { init(root); console.log('Created .citeskill/citations.json'); return; }
  if (command === 'add') {
    const o = options(args, ['id', 'kind', 'name', 'ref-type', 'ref', 'url', 'provider', 'model', 'share', 'evidence-url']);
    const manifest = load(root);
    const kind = required(o, 'kind') as Kind;
    if (!KINDS.includes(kind)) throw new Error(`Invalid kind: ${kind}`);
    const refType = required(o, 'ref-type');
    if (refType !== 'commit' && refType !== 'pr') throw new Error('--ref-type must be commit or pr.');
    const refValue = o.ref ?? (refType === 'commit' ? git(root, 'rev-parse', 'HEAD') : undefined);
    if (!refValue) throw new Error('Missing --ref.');
    const entry: Entry = { id: required(o, 'id'), kind, name: required(o, 'name'), ref: { type: refType, value: refValue } };
    if (o.url) entry.url = o.url;
    if (o.provider) entry.provider = o.provider;
    if (o.model) entry.model = o.model;
    if (o['evidence-url']) entry.evidenceUrl = o['evidence-url'];
    if (o.share !== undefined) entry.estimatedShare = Number(o.share);
    manifest.entries.push(entry);
    save(root, manifest);
    console.log(`Added ${entry.id}`);
    return;
  }
  if (command === 'validate') {
    const manifest = load(root);
    const ids = new Set(manifest.entries.map(e => e.id));
    const missing: string[] = [];
    for (const e of manifest.entries.filter(x => x.ref.type === 'commit')) {
      try { git(root, 'cat-file', '-e', `${e.ref.value}^{commit}`); }
      catch { missing.push(`Commit not found for ${e.id}: ${e.ref.value}`); }
    }
    if (args.some(x => x !== '--trailers')) throw new Error('Unknown validate option. Use --trailers.');
    if (args.includes('--trailers')) {
      const log = git(root, 'log', '--format=%H%x00%B%x00', '--all').split('\0');
      for (let i = 0; i + 1 < log.length; i += 2) for (const id of parseTrailer(log[i + 1])) if (!ids.has(id)) missing.push(`Unknown trailer ID ${id} in ${log[i]}`);
    }
    if (missing.length) throw new Error(missing.join('\n'));
    console.log(`Valid: ${manifest.entries.length} citation(s).`);
    return;
  }
  if (command === 'render') {
    const o = options(args, ['output']);
    const text = render(load(root));
    if (o.output) {
      const path = resolve(root, o.output);
      const old = existsSync(path) ? readFileSync(path, 'utf8') : '';
      const start = '<!-- citeskill:start -->';
      const end = '<!-- citeskill:end -->';
      const begin = old.indexOf(start);
      const finish = old.indexOf(end);
      if ((begin >= 0) !== (finish >= 0) || (begin >= 0 && finish < begin)) throw new Error('Broken CiteSkill markers in output file.');
      const next = begin >= 0 ? `${old.slice(0, begin)}${text}${old.slice(finish + end.length)}` : `${old.trimEnd()}${old ? '\n\n' : ''}${text}\n`;
      writeFileSync(path, next);
      console.log(`Updated ${o.output}`);
    } else console.log(text);
    return;
  }
  if (command === 'commit-link') {
    const o = options(args, ['ids']);
    const ids = required(o, 'ids').split(',').map(x => x.trim()).filter(Boolean);
    const known = new Set(load(root).entries.map(e => e.id));
    for (const id of ids) if (!known.has(id)) throw new Error(`Unknown citation ID: ${id}`);
    console.log(`CiteSkill-Refs: ${ids.join(', ')}`);
    return;
  }
  if (command === 'summary') { console.log(JSON.stringify(summarize(load(root)), null, 2)); return; }
  usage();
}
try { main(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
