import ts from 'typescript';
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils';
import { createCommonSourceCheck } from './common-source';

export const createStoreStateCheck = (
  services: ParserServicesWithTypeInformation,
) => {
  const program = services.program;
  const checker = program.getTypeChecker();
  const isCommonSource = createCommonSourceCheck();
  const declarations = new Map<ts.Declaration, boolean>();
  const isStoreDeclaration = (declaration: ts.Declaration): boolean => {
    const cached = declarations.get(declaration);

    if (cached !== undefined) {
      return cached;
    }

    const source = declaration.getSourceFile();
    let matches = false;

    if (isCommonSource(source)) {
      const module = checker.getSymbolAtLocation(source);
      const exported =
        module &&
        checker.getExportsOfModule(module).find((symbol) => {
          return symbol.name === 'Store';
        });
      const store =
        exported &&
        (exported.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exported)
          : exported);

      matches = store
        ? (checker
            .getDeclaredTypeOfSymbol(store)
            .getProperty('state')
            ?.getDeclarations()
            ?.includes(declaration) ?? false)
        : false;
    }

    declarations.set(declaration, matches);

    return matches;
  };

  const isStore = (type: ts.Type): boolean => {
    if (
      type.flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)
    ) {
      return false;
    }

    if (type.isUnion()) {
      const members = type.types.filter((member) => {
        return !(member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined));
      });

      return members.length > 0 && members.every(isStore);
    }

    return (
      type
        .getProperty('state')
        ?.getDeclarations()
        ?.some((declaration) => {
          return isStoreDeclaration(declaration);
        }) ?? false
    );
  };

  return (node: TSESTree.Node): boolean => {
    return isStore(services.getTypeAtLocation(node));
  };
};
