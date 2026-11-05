import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { memberKey } from './member-key';
import { findValueVariable } from './value-variable';

// Return the intrinsic identifier, preserving static member-key support.
export const runeCallee = (
  callee: TSESTree.CallExpression['callee'],
  source: TSESLint.SourceCode,
  name: string,
  key?: string,
): TSESTree.Identifier | undefined => {
  const identifier =
    callee.type === AST_NODE_TYPES.Identifier
      ? callee
      : key &&
          callee.type === AST_NODE_TYPES.MemberExpression &&
          memberKey(callee) === key &&
          callee.object.type === AST_NODE_TYPES.Identifier
        ? callee.object
        : undefined;

  if (identifier?.name !== name) {
    return undefined;
  }

  const variable = findValueVariable(source.getScope(identifier), name);

  return variable && variable.defs.length > 0 ? undefined : identifier;
};
