import ts from 'typescript';
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils';
import { createCommonSourceCheck } from './common-source';

export const createDispatchCheck = (
  services: ParserServicesWithTypeInformation,
) => {
  const checker = services.program.getTypeChecker();
  const isCommonSource = createCommonSourceCheck();
  const signatures = new Set<NonNullable<ts.Signature['declaration']>>();
  const symbols = new Map<ts.Symbol, boolean>();

  const isPublicDispatch = (symbol: ts.Symbol): boolean => {
    const cached = symbols.get(symbol);

    if (cached !== undefined) {
      return cached;
    }

    const matches =
      symbol.getDeclarations()?.some((declaration) => {
        const source = declaration.getSourceFile();

        if (!isCommonSource(source)) {
          return false;
        }

        const module = checker.getSymbolAtLocation(source);
        const exported =
          module &&
          checker.getExportsOfModule(module).find((item) => {
            return item.name === 'Dispatch';
          });
        const target =
          exported &&
          (exported.flags & ts.SymbolFlags.Alias
            ? checker.getAliasedSymbol(exported)
            : exported);

        if (target !== symbol) {
          return false;
        }

        checker
          .getDeclaredTypeOfSymbol(target)
          .getCallSignatures()
          .forEach((signature) => {
            if (signature.declaration) {
              signatures.add(signature.declaration);
            }
          });

        return true;
      }) ?? false;

    symbols.set(symbol, matches);

    return matches;
  };

  const hasDispatchAlias = (
    original: ts.Symbol,
    seen: Set<ts.Symbol>,
  ): boolean => {
    const symbol =
      original.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(original)
        : original;

    if (seen.has(symbol)) {
      return false;
    }

    if (isPublicDispatch(symbol)) {
      return true;
    }

    const next = new Set(seen).add(symbol);

    return (
      symbol.getDeclarations()?.some((declaration) => {
        if (!ts.isTypeAliasDeclaration(declaration)) {
          return false;
        }

        let target = declaration.type;

        while (ts.isParenthesizedTypeNode(target)) {
          target = target.type;
        }

        if (!ts.isTypeReferenceNode(target)) {
          return false;
        }

        const referenced = checker.getSymbolAtLocation(target.typeName);

        return !!referenced && hasDispatchAlias(referenced, next);
      }) ?? false
    );
  };

  const isDispatch = (type: ts.Type, seen: Set<ts.Type>): boolean => {
    if (
      seen.has(type) ||
      type.flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)
    ) {
      return false;
    }

    const next = new Set(seen).add(type);

    if (type.isUnion()) {
      const members = type.types.filter((member) => {
        return !(member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined));
      });

      return (
        members.length > 0 &&
        members.every((member) => {
          return isDispatch(member, next);
        })
      );
    }

    const symbol = type.aliasSymbol;

    if (!symbol) {
      return false;
    }

    if (!hasDispatchAlias(symbol, new Set())) {
      return false;
    }

    // TS may intern structurally equal aliases. Their signature declarations
    // still distinguish a local callback from the public Dispatch contract.
    const calls = type.getCallSignatures();

    return (
      calls.length > 0 &&
      calls.every((signature) => {
        return !!signature.declaration && signatures.has(signature.declaration);
      })
    );
  };

  return (node: TSESTree.Node): boolean => {
    return isDispatch(services.getTypeAtLocation(node), new Set());
  };
};
