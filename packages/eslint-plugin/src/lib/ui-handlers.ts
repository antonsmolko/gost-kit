import type { AST } from 'svelte-eslint-parser';
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { findValueVariable } from './value-variable';
import { inScript } from './svelte-scripts';

type Handler =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

export const createUiHandlerCollector = (
  source: TSESLint.SourceCode,
  scripts: readonly AST.SvelteScriptElement[],
) => {
  const handlers = new Set<Handler>();

  const resolve = (
    node: TSESTree.Node,
    inline: boolean,
    seen: Set<TSESLint.Scope.Variable>,
  ): Handler | undefined => {
    if (
      node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      node.type === AST_NODE_TYPES.FunctionExpression ||
      node.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return inline || inScript(node, scripts) ? node : undefined;
    }

    if (
      node.type === AST_NODE_TYPES.TSAsExpression ||
      node.type === AST_NODE_TYPES.TSTypeAssertion ||
      node.type === AST_NODE_TYPES.TSNonNullExpression ||
      node.type === AST_NODE_TYPES.ChainExpression
    ) {
      return resolve(node.expression, inline, seen);
    }

    if (node.type !== AST_NODE_TYPES.Identifier) {
      return undefined;
    }

    const variable = findValueVariable(source.getScope(node), node.name);

    if (
      !variable ||
      seen.has(variable) ||
      variable.references.some((reference) => {
        return reference.isWrite() && !reference.init;
      })
    ) {
      return undefined;
    }

    const next = new Set(seen).add(variable);

    return variable.defs
      .map((definition) => {
        if (
          definition.type === 'FunctionName' &&
          definition.node.type === AST_NODE_TYPES.FunctionDeclaration
        ) {
          return resolve(definition.node, false, next);
        }

        if (
          definition.type === 'Variable' &&
          definition.parent.kind === 'const' &&
          definition.node.id.type === AST_NODE_TYPES.Identifier &&
          definition.node.init
        ) {
          return resolve(definition.node.init, false, next);
        }

        return undefined;
      })
      .find((handler) => {
        return !!handler;
      });
  };

  const add = (expression: TSESTree.Node) => {
    const handler = resolve(expression, true, new Set());

    if (handler) {
      handlers.add(handler);
    }
  };

  return {
    handlers,
    attribute(node: TSESTree.Node) {
      // Parser-specific listeners are the only boundary for extended Svelte nodes.
      const attribute = node as unknown as AST.SvelteAttribute;

      if (
        !attribute.key.name.startsWith('on') ||
        attribute.key.name.length <= 2
      ) {
        return;
      }

      attribute.value.forEach((value) => {
        if (value.type === 'SvelteMustacheTag') {
          add(value.expression as TSESTree.Node);
        }
      });
    },
    directive(node: TSESTree.Node) {
      const directive = node as unknown as AST.SvelteDirective;

      if (directive.kind === 'EventHandler' && directive.expression) {
        add(directive.expression as TSESTree.Node);
      }
    },
  };
};
