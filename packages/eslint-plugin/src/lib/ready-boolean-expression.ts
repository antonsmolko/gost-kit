import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { memberKey } from './member-key';

export const readyBooleanExpression = (node: TSESTree.Expression): boolean => {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return readyBooleanExpression(node.expression);
  }

  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const staticKey =
    memberKey(node) !== undefined ||
    (node.computed &&
      node.property.type === AST_NODE_TYPES.Literal &&
      // AST numeric literals include values such as 1e999; a finite-number
      // runtime guard would change this syntax classification.
      typeof node.property.value === 'number');

  return (
    staticKey &&
    node.object.type !== AST_NODE_TYPES.Super &&
    readyBooleanExpression(node.object)
  );
};
