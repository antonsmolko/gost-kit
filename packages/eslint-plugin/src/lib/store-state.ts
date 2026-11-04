import ts from 'typescript';
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils';

export const createStoreStateCheck = (
  services: ParserServicesWithTypeInformation,
  filename: string,
) => {
  const program = services.program;
  const checker = program.getTypeChecker();
  const resolved = ts.resolveModuleName(
    '@gost-kit/common',
    filename,
    program.getCompilerOptions(),
    ts.sys,
  ).resolvedModule;
  const source = resolved && program.getSourceFile(resolved.resolvedFileName);
  const module = source && checker.getSymbolAtLocation(source);
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
  const declarations = new Set(
    store &&
      checker
        .getDeclaredTypeOfSymbol(store)
        .getProperty('state')
        ?.getDeclarations(),
  );

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
          return declarations.has(declaration);
        }) ?? false
    );
  };

  return (node: TSESTree.Node): boolean => {
    return isStore(services.getTypeAtLocation(node));
  };
};
