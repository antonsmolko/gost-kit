import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { memberKey } from './member-key';

export const isDerived = (
  node: TSESTree.CallExpression,
  source: TSESLint.SourceCode,
): boolean => {
  const identifier =
    node.callee.type === AST_NODE_TYPES.Identifier
      ? node.callee
      : node.callee.type === AST_NODE_TYPES.MemberExpression &&
          memberKey(node.callee) === 'by' &&
          node.callee.object.type === AST_NODE_TYPES.Identifier
        ? node.callee.object
        : undefined;

  if (identifier?.name !== '$derived') {
    return false;
  }

  let scope: TSESLint.Scope.Scope | null = source.getScope(identifier);

  while (scope) {
    const variable = scope.set.get('$derived');

    if (variable && variable.defs.length > 0) {
      return false;
    }

    scope = scope.upper;
  }

  return true;
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

    if (parent.type === AST_NODE_TYPES.CallExpression) {
      if (isDerived(parent, source)) {
        return call ? { derived: parent, call } : undefined;
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
        return call ? { derived: owner, call } : undefined;
      }

      return undefined;
    }

    current = parent;
  }

  return undefined;
};
