import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { runeCallee } from './rune-callee';
import { memberKey } from './member-key';
import type { AST } from 'svelte-eslint-parser';

export const isDerived = (
  node: TSESTree.CallExpression,
  source: TSESLint.SourceCode,
): boolean => {
  return !!runeCallee(node.callee, source, '$derived', 'by');
};

export const reactiveContext = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
) => {
  let current = node;
  let call:
    | TSESTree.CallExpression
    | TSESTree.NewExpression
    | TSESTree.TaggedTemplateExpression
    | undefined;

  while (current.parent) {
    const parent = current.parent;
    // Only svelte-eslint-parser introduces this extended parent node.
    const template = parent as unknown as AST.SvelteConstTag;

    if (template.type === 'SvelteConstTag') {
      return call ? { kind: 'templateConst' as const, call } : undefined;
    }

    if (parent.type === AST_NODE_TYPES.CallExpression) {
      if (isDerived(parent, source)) {
        return call
          ? { kind: 'derived' as const, derived: parent, call }
          : undefined;
      }
    }

    if (
      parent.type === AST_NODE_TYPES.CallExpression ||
      parent.type === AST_NODE_TYPES.NewExpression ||
      parent.type === AST_NODE_TYPES.TaggedTemplateExpression
    ) {
      call ??= parent;
    }

    // Instance fields execute only when an instance is created. Static fields
    // and computed keys execute while the class expression itself is evaluated.
    if (
      (parent.type === AST_NODE_TYPES.PropertyDefinition ||
        parent.type === AST_NODE_TYPES.AccessorProperty) &&
      !parent.static &&
      parent.value === current
    ) {
      return undefined;
    }

    if (
      parent.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      parent.type === AST_NODE_TYPES.FunctionExpression ||
      parent.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      const owner = parent.parent;

      if (
        owner?.type === AST_NODE_TYPES.CallExpression &&
        owner.callee.type === AST_NODE_TYPES.MemberExpression &&
        memberKey(owner.callee) === 'by' &&
        owner.arguments[0] === parent &&
        !parent.async &&
        !parent.generator &&
        isDerived(owner, source)
      ) {
        return call
          ? { kind: 'derived' as const, derived: owner, call }
          : undefined;
      }

      return undefined;
    }

    current = parent;
  }

  return undefined;
};
