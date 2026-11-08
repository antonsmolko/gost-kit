import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export const readyValue = (
  node: TSESTree.Node,
  isPresenterCall?: (call: TSESTree.CallExpression) => boolean,
): boolean => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- Syntax allowlist: every other AST kind is intentionally rejected.
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
    case AST_NODE_TYPES.Literal:
      return true;
    case AST_NODE_TYPES.ChainExpression:
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSTypeAssertion:
    case AST_NODE_TYPES.TSNonNullExpression:
    case AST_NODE_TYPES.TSSatisfiesExpression:
      return readyValue(node.expression, isPresenterCall);
    case AST_NODE_TYPES.MemberExpression:
      return (
        readyValue(node.object, isPresenterCall) &&
        (!node.computed || readyValue(node.property))
      );
    case AST_NODE_TYPES.TemplateLiteral:
      return node.expressions.length === 0;
    case AST_NODE_TYPES.UnaryExpression:
      return (
        (node.operator === '-' || node.operator === '+') &&
        node.argument.type === AST_NODE_TYPES.Literal &&
        (typeof node.argument.value === 'number' ||
          typeof node.argument.value === 'bigint')
      );
    case AST_NODE_TYPES.ArrayExpression:
      return node.elements.every((element) => {
        return !element || readyValue(element, isPresenterCall);
      });
    case AST_NODE_TYPES.SpreadElement:
      return readyValue(node.argument, isPresenterCall);
    case AST_NODE_TYPES.ObjectExpression:
      return node.properties.every((property) => {
        if (property.type === AST_NODE_TYPES.SpreadElement) {
          return readyValue(property.argument, isPresenterCall);
        }

        return (
          property.kind === 'init' &&
          !property.method &&
          (!property.computed || readyValue(property.key)) &&
          readyValue(property.value, isPresenterCall)
        );
      });
    case AST_NODE_TYPES.CallExpression:
      return (
        !!isPresenterCall?.(node) &&
        node.arguments.every((argument) => {
          return readyValue(argument, isPresenterCall);
        })
      );
    default:
      return false;
  }
};

export const readyPattern = (node: TSESTree.Node): boolean => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- Syntax allowlist: every other AST kind is intentionally rejected.
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
      return true;
    case AST_NODE_TYPES.ObjectPattern:
      return node.properties.every((property) => {
        return property.type === AST_NODE_TYPES.RestElement
          ? readyPattern(property.argument)
          : (!property.computed || readyValue(property.key)) &&
              readyPattern(property.value);
      });
    case AST_NODE_TYPES.ArrayPattern:
      return node.elements.every((element) => {
        return !element || readyPattern(element);
      });
    case AST_NODE_TYPES.RestElement:
      return readyPattern(node.argument);
    default:
      return false;
  }
};
