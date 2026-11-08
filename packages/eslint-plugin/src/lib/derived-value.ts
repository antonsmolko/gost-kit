import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { readyPattern } from './ready-value';

export const derivedValue = (
  node: TSESTree.Node,
  isReady: (value: TSESTree.Node) => boolean,
): boolean => {
  if (
    (node.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
      node.type !== AST_NODE_TYPES.FunctionExpression) ||
    node.async ||
    node.generator
  ) {
    return false;
  }

  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return isReady(node.body);
  }

  const statements = node.body.body;
  const last = statements.at(-1);

  return (
    !!last &&
    last.type === AST_NODE_TYPES.ReturnStatement &&
    !!last.argument &&
    isReady(last.argument) &&
    statements.slice(0, -1).every((statement) => {
      return (
        statement.type === AST_NODE_TYPES.VariableDeclaration &&
        statement.kind === 'const' &&
        statement.declarations.every((declaration) => {
          return (
            readyPattern(declaration.id) &&
            !!declaration.init &&
            isReady(declaration.init)
          );
        })
      );
    })
  );
};
