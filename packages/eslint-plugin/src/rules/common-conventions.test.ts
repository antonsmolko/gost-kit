import { Linter } from 'eslint';
import { join } from 'node:path';
import ts from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import { plugin } from '../index';

const lint = (
  code: string,
  filename = 'example.mts',
  options: { commonRoot?: string } = {},
) => {
  const linter = new Linter();

  return linter.verifyAndFix(
    code,
    {
      files: ['**/*.{ts,mts,cts}'],

      languageOptions: { parser: ts.parser },
      plugins: { gost: plugin },
      rules: {
        'gost/prefer-nullish-types': ['error', options],
        'gost/prefer-guard': ['error', options],
      },
    },
    { filename },
  );
};

describe('common conventions', () => {
  it('fixes all three unions and preserves non-nullish members', () => {
    const result = lint(
      "import type { ApiError } from '@gost-kit/common';\n" +
        'type Retry = undefined | ApiError;\n' +
        'type Failure = null | ApiError;\n' +
        'type State = null | ApiError | false | undefined;',
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('Ulx<ApiError>');
    expect(result.output).toContain('Nlx<ApiError>');
    expect(result.output).toContain('Nil<ApiError | false>');
    expect(result.output).toMatch(/import type \{ ApiError, Ulx, Nlx, Nil \}/u);
  });

  it('uses visible aliases and adds a fresh import for shadowed types', () => {
    const result = lint(
      "import type { Nlx as Nullable } from '@gost-kit/common';\n" +
        'type One = string | null;\n' +
        'type Two<Nullable, Nlx> = Nullable | Nlx | null;',
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('type One = Nullable<string>');
    expect(result.output).toContain('Nlx as GostNlx');
    expect(result.output).toContain('GostNlx<Nullable | Nlx>');
  });

  it('preserves parenthesized function types in larger unions', () => {
    const result = lint('type Handler = null | (() => void) | false;');

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('Nlx<(() => void) | false>');
  });

  it('leaves nullish-only, inference and commented unions intact', () => {
    const result = lint(
      'type Absence = undefined | null;\n' +
        'type Value<T> = T extends (infer U | null) ? U : never;\n' +
        'type Comment = string /* explanation */ | null;',
    );

    expect(result.output).toContain('infer U | null');
    expect(result.output).toContain('/* explanation */');
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(['gost/prefer-nullish-types']);
  });

  it('uses an existing mixed import and preserves inequality', () => {
    const result = lint(
      "import { guard as is } from '@gost-kit/common';\n" +
        "const text = (name: unknown) => 'string' === typeof name;\n" +
        "const flag = (value: unknown) => typeof value !== 'boolean';\n" +
        'const empty = (value: unknown) => value === null || value === undefined;',
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('is.string(name)');
    expect(result.output).toContain('!is.boolean(value)');
    expect(result.output).toContain('is.nil(value)');
  });

  it('adds a value import alongside type-only imports and avoids local shadowing', () => {
    const result = lint(
      "import type { AppError } from '@gost-kit/common';\n" +
        "const check = (guard: unknown) => typeof guard === 'string';",
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain(
      "import { guard as gostGuard } from '@gost-kit/common';",
    );
    expect(result.output).toContain('gostGuard.string(guard)');
  });

  it('uses internal relative imports for common sources', () => {
    const commonRoot = join(process.cwd(), 'packages/common');
    const result = lint(
      "export const read = (value: string | null) => typeof value === 'string';",
      'packages/common/src/api/read.ts',
      { commonRoot },
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain("from '../types/nlx'");
    expect(result.output).toContain("from '../sharred/lib/guard'");
  });

  it('imports type definitions directly from a sibling file inside common/types', () => {
    const result = lint(
      'export type Failure = string | null;',
      'packages/common/src/types/failure.ts',
      { commonRoot: join(process.cwd(), 'packages/common') },
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain("import type { Nlx } from './nlx';");
  });

  it('reuses a namespace import for both kinds of helpers', () => {
    const result = lint(
      "import * as common from '@gost-kit/common';\n" +
        'export const absent = (value: string | (null | undefined)) => value === null;',
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('common.Nil<string>');
    expect(result.output).toContain('common.guard.nlx(value)');
  });

  it('preserves a global script and reports both changes without a fix', () => {
    const code =
      "const globalCheck = (value: string | null) => typeof value === 'string';";
    const result = lint(code, 'global.ts');

    expect(result.output).toBe(code);
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(['gost/prefer-nullish-types', 'gost/prefer-guard']);
  });

  it('uses guard.error only for the global Error constructor', () => {
    const result = lint(
      'const external = (value: unknown) => value instanceof Error;\n' +
        'const custom = (value: unknown, Error: ErrorConstructor) => value instanceof Error;',
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('=> guard.error(value)');
    expect(result.output).toContain(
      'Error: ErrorConstructor) => value instanceof Error',
    );
  });

  it('keeps discriminant checks and defensive typeof through erased wrappers', () => {
    const code =
      'type State = { kind: true; yes: string } | { kind: false; no: number };\n' +
      'export const read = (state: State) => state.kind === true ? state.yes : state.no;\n' +
      'declare const absent: unknown;\n' +
      "export const exists = typeof ((absent as unknown)!) === 'string';";
    const result = lint(code);

    expect(result.messages).toEqual([]);
    expect(result.output).toBe(code);
  });

  it('keeps discriminant aliases and boolean aliases of narrowing conditions', () => {
    const code = [
      'type State = { kind: true; yes: string } | { kind: false; no: number };',
      'export function read(state: State) { const { kind } = state; return kind === true ? state.yes : state.no; }',
      'export function readAlias(state: State) { const kind = state.kind; return kind === true ? state.yes : state.no; }',
      'export function readParam({ kind, yes, no }: { kind: true; yes: string; no?: never } | { kind: false; no: number; yes?: never }) { return kind === true ? yes : no.toFixed(); }',
      "export function format(value: string | number) { const text = typeof value === 'string'; return text === true ? value.toUpperCase() : value.toFixed(); }",
      "export function formatDirect(value: string | number) { return (typeof value === 'string') === true ? value.toUpperCase() : value.toFixed(); }",
    ].join('\n');
    const result = lint(code);

    expect(result.messages).toEqual([]);
    expect(result.output).toBe(
      "import { guard } from '@gost-kit/common';\n" +
        code.replaceAll("typeof value === 'string'", 'guard.string(value)'),
    );
  });

  it('reports without introducing an ESM value import into a .cts file', () => {
    const code = "const read = (value: unknown) => typeof value === 'boolean';";
    const result = lint(code, 'check.cts');

    expect(result.output).toBe(code);
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(['gost/prefer-guard']);
  });

  it('keeps different runtime checks and defensive typeof expressions', () => {
    const code =
      "declare const external: string; const a = typeof external === 'string';\n" +
      "const b = typeof unknownGlobal === 'string';\n" +
      "const c = (value: unknown) => typeof value === 'number';\n" +
      'const d = (value: unknown, undefined: unknown) => value === undefined;\n' +
      'const e = (read: () => unknown) => read() === null || read() === undefined;';

    expect(lint(code).output).toBe(
      code
        .replace(
          'read() === null || read() === undefined',
          'guard.nlx(read()) || guard.ulx(read())',
        )
        .replace(/^/u, "import { guard } from '@gost-kit/common';\n"),
    );
  });
});
