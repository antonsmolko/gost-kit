import ts from 'typescript';
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils';

const unwrap = (node: ts.Expression): ts.Expression => {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return unwrap(node.expression);
  }

  return node;
};

export const createPresenterCallCheck = (
  services: ParserServicesWithTypeInformation,
) => {
  const checker = services.program.getTypeChecker();
  const cache = new Map<ts.Symbol, boolean>();
  const symbolAt = (value: ts.Expression): ts.Symbol | undefined => {
    const node = unwrap(value);

    if (ts.isIdentifier(node)) {
      return checker.getSymbolAtLocation(node);
    }

    if (ts.isPropertyAccessExpression(node)) {
      return checker.getSymbolAtLocation(node.name);
    }

    if (
      ts.isElementAccessExpression(node) &&
      (ts.isStringLiteral(node.argumentExpression) ||
        ts.isNumericLiteral(node.argumentExpression))
    ) {
      return checker
        .getTypeAtLocation(node.expression)
        .getProperty(node.argumentExpression.text);
    }

    return undefined;
  };
  const stableReference = (
    value: ts.Expression,
    seen = new Set<ts.Symbol>(),
  ): boolean => {
    const node = unwrap(value);

    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      return stableReference(node.expression, seen);
    }

    if (!ts.isIdentifier(node)) {
      return false;
    }

    const symbol = checker.getSymbolAtLocation(node);

    if (!symbol || seen.has(symbol)) {
      return false;
    }

    const next = new Set(seen).add(symbol);

    return (
      symbol.getDeclarations()?.some((declaration) => {
        if (
          ts.isImportSpecifier(declaration) ||
          ts.isImportClause(declaration) ||
          ts.isNamespaceImport(declaration)
        ) {
          return true;
        }

        return (
          ts.isVariableDeclaration(declaration) &&
          ts.isVariableDeclarationList(declaration.parent) &&
          !!(declaration.parent.flags & ts.NodeFlags.Const) &&
          !!declaration.initializer &&
          stableReference(declaration.initializer, next)
        );
      }) ?? false
    );
  };
  const resolve = (
    symbol: ts.Symbol | undefined,
    seen = new Set<ts.Symbol>(),
  ): boolean => {
    if (!symbol || seen.has(symbol)) {
      return false;
    }

    const cached = cache.get(symbol);

    if (cached !== undefined) {
      return cached;
    }

    const next = new Set(seen).add(symbol);
    const result =
      symbol.flags & ts.SymbolFlags.Alias
        ? resolve(checker.getAliasedSymbol(symbol), next)
        : (symbol.getDeclarations()?.some((declaration) => {
            const presenter = /\.presenter(?:\.d)?\.ts$/u.test(
              declaration.getSourceFile().fileName,
            );

            if (ts.isFunctionDeclaration(declaration)) {
              return presenter && ts.isSourceFile(declaration.parent);
            }

            if (ts.isExportAssignment(declaration)) {
              const expression = unwrap(declaration.expression);

              if (
                presenter &&
                (ts.isArrowFunction(expression) ||
                  ts.isFunctionExpression(expression))
              ) {
                return true;
              }

              return resolve(symbolAt(expression), next);
            }

            if (
              !ts.isVariableDeclaration(declaration) ||
              !ts.isVariableDeclarationList(declaration.parent) ||
              !(declaration.parent.flags & ts.NodeFlags.Const)
            ) {
              return false;
            }

            if (
              presenter &&
              ts.isVariableStatement(declaration.parent.parent) &&
              ts.isSourceFile(declaration.parent.parent.parent) &&
              checker
                .getTypeOfSymbolAtLocation(symbol, declaration)
                .getCallSignatures().length > 0
            ) {
              return true;
            }

            return (
              !!declaration.initializer &&
              stableReference(declaration.initializer) &&
              resolve(symbolAt(declaration.initializer), next)
            );
          }) ?? false);

    cache.set(symbol, result);

    return result;
  };

  return (call: TSESTree.CallExpression): boolean => {
    const node = services.esTreeNodeToTSNodeMap.get(call.callee);

    if (!ts.isExpression(node) || !stableReference(node)) {
      return false;
    }

    return resolve(symbolAt(node));
  };
};
