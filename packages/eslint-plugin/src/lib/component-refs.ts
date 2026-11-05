import { findValueVariable } from './value-variable';
import type { AST } from 'svelte-eslint-parser';
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

export const createComponentRefCheck = (source: TSESLint.SourceCode) => {
  const variables = new Set<TSESLint.Scope.Variable>();
  const services = source.parserServices;
  // Svelte extends ESTree with script elements; only its parser supplies these.
  const scripts =
    services && 'isSvelte' in services && services.isSvelte === true
      ? (source.ast as unknown as AST.SvelteProgram).body.filter(
          (node): node is AST.SvelteScriptElement => {
            return node.type === 'SvelteScriptElement';
          },
        )
      : [];
  const instanceScripts = scripts.filter((script) => {
    return !script.startTag.attributes.some((attribute) => {
      return (
        attribute.type === 'SvelteAttribute' &&
        (attribute.key.name === 'module' ||
          (attribute.key.name === 'context' &&
            attribute.value.some((value) => {
              return value.type === 'SvelteLiteral' && value.value === 'module';
            })))
      );
    });
  });

  const isEmpty = (call: TSESTree.CallExpression): boolean => {
    if (call.arguments.length === 0) {
      return true;
    }

    if (call.arguments.length !== 1) {
      return false;
    }

    const value = call.arguments[0];

    if (value.type === AST_NODE_TYPES.Literal && value.raw === 'null') {
      return true;
    }

    if (
      value.type === AST_NODE_TYPES.Identifier &&
      value.name === 'undefined'
    ) {
      const variable = findValueVariable(source.getScope(value), value.name);

      return !variable || variable.defs.length === 0;
    }

    return false;
  };

  return {
    recordBinding(node: TSESTree.Node) {
      // This listener runs only for SvelteDirective nodes supplied by the parser.
      const directive = node as unknown as AST.SvelteDirective;

      if (
        directive.kind !== 'Binding' ||
        directive.key.name.name !== 'this' ||
        directive.expression?.type !== AST_NODE_TYPES.Identifier
      ) {
        return;
      }

      const identifier = directive.expression as TSESTree.Identifier;
      const variable = findValueVariable(
        source.getScope(identifier),
        identifier.name,
      );

      if (variable) {
        variables.add(variable);
      }
    },
    allows(call: TSESTree.CallExpression): boolean {
      const declaration = call.parent;

      if (
        declaration.type !== AST_NODE_TYPES.VariableDeclarator ||
        declaration.init !== call ||
        declaration.id.type !== AST_NODE_TYPES.Identifier ||
        !isEmpty(call)
      ) {
        return false;
      }

      if (
        !instanceScripts.some((script) => {
          return (
            call.range[0] >= script.range[0] && call.range[1] <= script.range[1]
          );
        })
      ) {
        return false;
      }

      const variable = findValueVariable(
        source.getScope(declaration.id),
        declaration.id.name,
      );

      return !!variable && variables.has(variable);
    },
  };
};
