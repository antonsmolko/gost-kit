import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

const hasOptionalAccess = (node: TSESTree.Node): boolean => {
  let current = node;

  while (true) {
    if (
      current.type === AST_NODE_TYPES.CallExpression ||
      current.type === AST_NODE_TYPES.MemberExpression
    ) {
      if (current.optional) {
        return true;
      }

      current =
        current.type === AST_NODE_TYPES.CallExpression
          ? current.callee
          : current.object;
    } else if (
      current.type === AST_NODE_TYPES.TSAsExpression ||
      current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
      current.type === AST_NODE_TYPES.TSNonNullExpression ||
      current.type === AST_NODE_TYPES.TSTypeAssertion ||
      current.type === AST_NODE_TYPES.TSInstantiationExpression
    ) {
      current = current.expression;
    } else {
      // A nested ChainExpression ends an earlier chain (e.g. `(store?.dispatch)()`).
      // Arguments are not part of this path; enclosing argument/key gates are checked below.
      return false;
    }
  }
};

export const isOptionalCall = (call: TSESTree.CallExpression): boolean => {
  if (hasOptionalAccess(call)) {
    return true;
  }

  let current: TSESTree.Node = call;

  while (current.parent) {
    const parent: TSESTree.Node = current.parent;

    if (
      parent.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      parent.type === AST_NODE_TYPES.FunctionExpression ||
      parent.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return false;
    }

    // Optional calls/accesses skip their arguments and computed keys too.
    if (
      ((parent.type === AST_NODE_TYPES.CallExpression &&
        parent.arguments.some((argument) => {
          return argument === current;
        })) ||
        (parent.type === AST_NODE_TYPES.MemberExpression &&
          parent.computed &&
          parent.property === current)) &&
      hasOptionalAccess(parent)
    ) {
      return true;
    }

    current = parent;
  }

  return false;
};
