import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = join(import.meta.dirname, 'cli.js');

test('CLI records a real Git commit, renders README, and validates trailers', () => {
  const root = mkdtempSync(join(tmpdir(), 'citeskill-test-'));
  const run = (cmd: string, ...args: string[]) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
  try {
    run('git', 'init');
    run('git', 'config', 'user.email', 'test@example.com');
    run('git', 'config', 'user.name', 'Test');
    writeFileSync(join(root, 'work.txt'), 'real work\n');
    run('git', 'add', 'work.txt');
    run('git', 'commit', '-m', 'Create work');
    const sha = run('git', 'rev-parse', 'HEAD');
    run(process.execPath, cli, 'init');
    run(process.execPath, cli, 'add', '--id', 'agent-test', '--kind', 'model', '--name', 'Test Model', '--provider', 'Example', '--share', '40', '--ref-type', 'commit', '--ref', sha);
    assert.equal(run(process.execPath, cli, 'commit-link', '--ids', 'agent-test'), 'CiteSkill-Refs: agent-test');
    run(process.execPath, cli, 'add', '--id', 'second-model', '--kind', 'model', '--name', 'Second', '--share', '60', '--ref-type', 'commit', '--ref', sha.slice(0, 8));
    const manifestPath = join(root, '.citeskill/citations.json');
    assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).entries[1].ref.value, sha);
    const before = readFileSync(manifestPath, 'utf8');
    const duplicateRef = JSON.parse(before);
    duplicateRef.entries[1].ref.value = sha.slice(0, 8);
    duplicateRef.entries[1].estimatedShare = 61;
    writeFileSync(manifestPath, JSON.stringify(duplicateRef));
    assert.throws(() => run(process.execPath, cli, 'validate'), /exceed 100/);
    assert.throws(() => run(process.execPath, cli, 'summary'), /exceed 100/);
    writeFileSync(manifestPath, before);
    assert.throws(() => run(process.execPath, cli, 'update', '--id', 'second-model', '--share', '61'), /exceed 100/);
    assert.equal(readFileSync(manifestPath, 'utf8'), before);
    run(process.execPath, cli, 'update', '--id', 'second-model', '--name', 'Updated', '--unset', 'share');
    run(process.execPath, cli, 'relink', '--ids', 'second-model', '--ref-type', 'pr', '--ref', '42');
    const summary = JSON.parse(run(process.execPath, cli, 'summary'));
    assert.deepEqual(summary.coverage, { total: 2, agent: 0, model: 1, provider: 1 });
    run(process.execPath, cli, 'remove', '--id', 'second-model');
    const short = JSON.parse(readFileSync(manifestPath, 'utf8'));
    short.entries[0].ref.value = sha.slice(0, 8);
    writeFileSync(manifestPath, JSON.stringify(short));
    run(process.execPath, cli, 'normalize');
    assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).entries[0].ref.value, sha);
    run(process.execPath, cli, 'render', '--output', 'README.md');
    assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /Test Model/);
    run('git', 'add', '.');
    run('git', 'commit', '-m', 'Record source', '-m', 'CiteSkill-Refs: agent-test');
    assert.match(run(process.execPath, cli, 'validate', '--trailers'), /Valid: 1 citation/);
    assert.throws(() => run(process.execPath, cli, 'remove', '--id', 'agent-test'), /referenced by reachable history/);
    const current = run('git', 'branch', '--show-current');
    run('git', 'checkout', '-b', 'other-work');
    run('git', 'commit', '--allow-empty', '-m', 'Unmerged citation', '-m', 'CiteSkill-Refs: other-branch-only');
    run('git', 'checkout', current);
    assert.match(run(process.execPath, cli, 'validate', '--trailers'), /Valid: 1 citation/);
    run('git', 'commit', '--allow-empty', '-m', 'Invalid citation on current branch', '-m', 'CiteSkill-Refs: missing-current-id');
    assert.throws(() => run(process.execPath, cli, 'validate', '--trailers'), /Unknown trailer ID missing-current-id/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

for (const bundle of ['plugins/citeskill', 'claude-plugin']) test(`${bundle} preserves citation IDs after rewritten commits`, () => {
  const root = mkdtempSync(join(tmpdir(), 'citeskill-relink-'));
  const bundled = join(import.meta.dirname, '..', bundle, 'scripts/cli.js');
  const run = (cmd: string, ...args: string[]) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  try {
    run('git', 'init');
    run('git', 'config', 'user.email', 'test@example.com');
    run('git', 'config', 'user.name', 'Test');
    run('git', 'commit', '--allow-empty', '-m', 'Original work');
    const old = run('git', 'rev-parse', 'HEAD');
    run(process.execPath, bundled, 'init');
    run(process.execPath, bundled, 'add', '--id', 'skill-work', '--kind', 'skill', '--name', 'Direct skill', '--ref-type', 'commit', '--ref', old);
    run('git', 'commit', '--amend', '--allow-empty', '-m', 'Rewritten work', '-m', 'CiteSkill-Refs: skill-work');
    const replacement = run('git', 'rev-parse', 'HEAD');
    assert.notEqual(old, replacement);
    run(process.execPath, bundled, 'relink', '--ids', 'skill-work', '--ref-type', 'commit', '--ref', replacement);
    assert.match(run(process.execPath, bundled, 'validate', '--trailers'), /Valid: 1/);
    const path = join(root, '.citeskill/citations.json');
    const saved = readFileSync(path, 'utf8');
    assert.equal(JSON.parse(saved).entries[0].ref.value, replacement);
    assert.throws(() => run(process.execPath, bundled, 'relink', '--ids', 'skill-work', '--ref-type', 'commit', '--ref', 'deadbee'));
    assert.equal(readFileSync(path, 'utf8'), saved);
    writeFileSync(join(root, 'README.md'), '<!-- citeskill:start --><!-- citeskill:end --><!-- citeskill:start --><!-- citeskill:end -->');
    assert.throws(() => run(process.execPath, bundled, 'render', '--output', 'README.md'), /Duplicate CiteSkill markers/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
