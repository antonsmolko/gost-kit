import { expect, test } from 'vitest';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript-eslint';
import { memberKey } from './member-key';

test.each([
  ['value.ready', 'ready', 'ready'],
  ['value["ready"]', 'ready', 'ready'],
  ["value['ready']", 'ready', 'ready'],
  ['value[0]', undefined, '0'],
  ['value[0x10]', undefined, '16'],
  ['value[1e999]', undefined, 'Infinity'],
  ['value[-1]', undefined, undefined],
  ['value[10n]', undefined, undefined],
  ['value[key]', undefined, undefined],
  ['value[getKey()]', undefined, undefined],
  ['value[true]', undefined, undefined],
  ['value[`ready`]', undefined, undefined],
] as const)(
  'static member %s preserves default policy and explicit numeric opt-in',
  (code, ordinary, numeric) => {
    // typescript-eslint exposes a minimal ESLint parser interface (ast: unknown).
    const ast = ts.parser.parseForESLint(code).ast as TSESTree.Program;
    const statement = ast.body[0];

    if (
      statement.type !== AST_NODE_TYPES.ExpressionStatement ||
      statement.expression.type !== AST_NODE_TYPES.MemberExpression
    ) {
      throw new Error('Expected a member expression fixture');
    }

    expect(memberKey(statement.expression)).toBe(ordinary);
    expect(memberKey(statement.expression, { numeric: true })).toBe(numeric);
  },
);
