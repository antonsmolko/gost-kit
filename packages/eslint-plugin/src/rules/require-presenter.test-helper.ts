import { afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, compileModule } from 'svelte/compiler';
import ts from 'typescript';

export const presenterFixtures = () => {
  const root = mkdtempSync(join(tmpdir(), 'gost-presenter-'));

  symlinkSync(
    fileURLToPath(new URL('../../../../node_modules', import.meta.url)),
    join(root, 'node_modules'),
    'dir',
  );
  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        allowJs: true,
        target: 'ES2024',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        types: ['svelte'],
      },
      include: ['**/*.svelte', '**/*.ts', '**/*.js'],
    }),
  );

  const modules = {
    'person.presenter.ts': `import type { Fn } from '@gost-kit/common';
export type Input = { name: string };
export const personPresenter = ({ state }: { state: Input }) => ({ label: state.name });
export const typedPresenter: Fn<{ state: Input }, { label: string }> = (params = { state: { name: '' } }) => ({ label: params.state.name });
export default personPresenter;`,
    'barrel.ts':
      "export { personPresenter as publicPresenter, default as defaultPresenter } from './person.presenter'; export * from './person.presenter';",
    'nested.ts': "export * from './barrel';",
    'format.ts':
      'export const format = (input: { name: string }) => input.name.trim();',
    'forged.presenter.ts':
      "export { format as fakePresenter } from './format';",
    'external.presenter.d.ts':
      'export declare const externalPresenter: (params: { state: { name: string } }) => { label: string };',
    'javascript.presenter.js':
      'export const javascriptPresenter = (input) => input;',
  };

  Object.entries(modules).forEach(([file, code]) => {
    writeFileSync(join(root, file), code);
  });
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  let count = 0;
  const fixture = (code: string, module = false, validate = true) => {
    const filename = join(
      root,
      `Case${count}${module ? '.svelte.ts' : '.svelte'}`,
    );

    count += 1;

    if (!validate) {
      // Parser-only shadowing probe: the Svelte compiler reserves dollar names.
    } else if (module) {
      compileModule(
        ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
        { filename },
      );
    } else {
      compile(code, { filename });
    }
    writeFileSync(filename, code);

    return { code, filename };
  };
  const component = (script: string, template = '') => {
    return fixture(`<script lang="ts">${script}</script>${template}`);
  };

  return { root, fixture, component };
};
