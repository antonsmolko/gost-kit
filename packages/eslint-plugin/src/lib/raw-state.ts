import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { runeCallee } from './rune-callee';
import { findValueVariable } from './value-variable';

// Inspect the original scope: Svelte's typed parser synthesizes rune declarations
// in a virtual TS file. Plain aliases of raw state capture a nonreactive snapshot.
export const createRawStateCheck = (source: TSESLint.SourceCode) => {
  return (node: TSESTree.Node): boolean => {
    if (node.type !== AST_NODE_TYPES.Identifier) {
      return false;
    }

    const variable = findValueVariable(source.getScope(node), node.name);

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
          !runeCallee(init.callee, source, '$state', 'raw')
        ) {
          return false;
        }

        return true;
      }) ?? false
    );
  };
};
