import { globSync, rmSync } from 'node:fs';

const paths = globSync([
  'dist/**/*.test.*',
  'dist/**/__tests__',
  '.svelte-kit/__package__',
]);

for (const path of paths) {
  rmSync(path, { recursive: true, force: true });
}
