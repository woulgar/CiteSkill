import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

for (const plugin of ['plugins/citeskill', 'claude-plugin']) {
  const destination = join(plugin, 'scripts');
  mkdirSync(destination, { recursive: true });
  for (const name of ['cli.js', 'core.js']) copyFileSync(join('dist', name), join(destination, name));
}
