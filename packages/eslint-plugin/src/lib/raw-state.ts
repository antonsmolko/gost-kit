import {
  AST_NODE_TYPES,
  ASTUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { memberKey } from './member-key';

// Inspect the original scope: Svelte's typed parser synthesizes rune declarations
// in a virtual TS file. Plain aliases of raw state capture a nonreactive snapshot.
export const createRawStateCheck = (source: TSESLint.SourceCode) => {
  return (node: TSESTree.Node): boolean => {
    if (node.type !== AST_NODE_TYPES.Identifier) {
      return false;
    }

    const variable = ASTUtils.findVariable(source.getScope(node), node.name);

    return (
      variable?.defs.some((definition) => {
        if (
          definition.type !== 'Variable' ||
          definition.node.id.type !== AST_NODE_TYPES.Identifier ||
          definition.node.id.name !== node.name
        ) {
          return false;
        }

        const init = definition.node.init;

        if (
          init?.type !== AST_NODE_TYPES.CallExpression ||
          init.callee.type !== AST_NODE_TYPES.MemberExpression ||
          memberKey(init.callee) !== 'raw' ||
          init.callee.object.type !== AST_NODE_TYPES.Identifier ||
          init.callee.object.name !== '$state'
        ) {
          return false;
        }

        const rune = ASTUtils.findVariable(
          source.getScope(init.callee.object),
          '$state',
        );

        return !rune || rune.defs.length === 0;
      }) ?? false
    );
  };
};
