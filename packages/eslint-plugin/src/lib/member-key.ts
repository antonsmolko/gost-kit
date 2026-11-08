import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export const memberKey = (
  node: TSESTree.MemberExpression,
  { numeric = false }: { numeric?: boolean } = {},
): string | undefined => {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }

  if (node.computed && node.property.type === AST_NODE_TYPES.Literal) {
    if (
      node.property.raw.startsWith("'") ||
      node.property.raw.startsWith('"')
    ) {
      return String(node.property.value);
    }

    // Match numeric AST literals, including values such as 1e999; finiteness
    // would change syntax classification. Existing callers remain names-only.
    if (numeric && typeof node.property.value === 'number') {
      return String(node.property.value);
    }
  }

  return undefined;
};
