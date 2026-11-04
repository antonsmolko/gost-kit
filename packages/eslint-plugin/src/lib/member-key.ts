import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export const memberKey = (
  node: TSESTree.MemberExpression,
): string | undefined => {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }

  if (node.computed && node.property.type === AST_NODE_TYPES.Literal) {
    return node.property.raw.startsWith("'") ||
      node.property.raw.startsWith('"')
      ? String(node.property.value)
      : undefined;
  }

  return undefined;
};
