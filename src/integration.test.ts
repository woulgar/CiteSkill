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
    run(process.execPath, cli, 'render', '--output', 'README.md');
    assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /Test Model/);
    run('git', 'add', '.');
    run('git', 'commit', '-m', 'Record source', '-m', 'CiteSkill-Refs: agent-test');
    assert.match(run(process.execPath, cli, 'validate', '--trailers'), /Valid: 1 citation/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
