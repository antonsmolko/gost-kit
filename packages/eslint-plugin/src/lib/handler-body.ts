import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

// Visit only the handler's own evaluation. Deferred function bodies are separate callbacks.
export const visitHandlerBody = (
  root: TSESTree.Node,
  source: TSESLint.SourceCode,
  visit: (node: TSESTree.Node) => void,
) => {
  const walk = (node: TSESTree.Node) => {
    if (
      node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      node.type === AST_NODE_TYPES.FunctionExpression ||
      node.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return;
    }

    visit(node);

    (source.visitorKeys[node.type] ?? []).forEach((key) => {
      if (
        (node.type === AST_NODE_TYPES.PropertyDefinition ||
          node.type === AST_NODE_TYPES.AccessorProperty) &&
        !node.static &&
        key === 'value'
      ) {
        return;
      }

      const value = (
        node as unknown as Record<
          string,
          TSESTree.Node | TSESTree.Node[] | null
        >
      )[key];

      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child) {
            walk(child);
          }
        });
      } else if (value) {
        walk(value);
      }
    });
  };

  walk(root);
};
