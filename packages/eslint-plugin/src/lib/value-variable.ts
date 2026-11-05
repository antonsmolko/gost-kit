import { AST_NODE_TYPES, type TSESLint } from '@typescript-eslint/utils';

// A nearer type-only declaration does not shadow a runtime value in an outer scope.
export const findValueVariable = (
  initialScope: TSESLint.Scope.Scope,
  name: string,
) => {
  for (
    let scope: TSESLint.Scope.Scope | null = initialScope;
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set.get(name);

    // Plain JavaScript parsers do not supply the TypeScript namespace flag.
    if (
      variable &&
      variable.isValueVariable !== false &&
      (variable.defs.length === 0 ||
        variable.defs.some((definition) => {
          if (definition.isVariableDefinition === false) {
            return false;
          }

          if (definition.type !== 'ImportBinding') {
            return true;
          }

          return (
            definition.parent.importKind !== 'type' &&
            !(
              definition.node.type === AST_NODE_TYPES.ImportSpecifier &&
              definition.node.importKind === 'type'
            )
          );
        }))
    ) {
      return variable;
    }
  }

  return undefined;
};
