import { dirname, join, relative, sep } from 'node:path';
import {
  AST_NODE_TYPES as Node,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { findValueVariable } from './value-variable';

export const commonImportSource = (
  filename: string,
  commonRoot: string | undefined,
  target: 'types' | 'sharred/lib/guard',
): string => {
  if (commonRoot === undefined) {
    return '@gost-kit/common';
  }

  const path = relative(dirname(filename), join(commonRoot, 'src', target))
    .split(sep)
    .join('/');

  return path.startsWith('../') ? path : `./${path}`;
};

const findTypeVariable = (scope: TSESLint.Scope.Scope, name: string) => {
  for (
    let current: TSESLint.Scope.Scope | null = scope;
    current;
    current = current.upper
  ) {
    const variable = current.set.get(name);

    if (variable?.isTypeVariable) {
      return variable;
    }
  }

  return undefined;
};

export const createCommonImport = (
  source: TSESLint.SourceCode,
  path: string,
  filename: string,
) => {
  const imports = source.ast.body.filter(
    (node): node is TSESTree.ImportDeclaration => {
      return node.type === Node.ImportDeclaration;
    },
  );
  const matching = imports.filter((node) => {
    return node.source.value === path && node.attributes.length === 0;
  });
  // A new import must not capture references elsewhere in the module.
  const identifiers = new Set(
    source.ast.tokens
      .filter((token) => {
        return token.type === 'Identifier';
      })
      .map((token) => {
        return token.value;
      }),
  );
  const quotes = imports[0]?.source.raw.startsWith('"') ? '"' : "'";

  return (node: TSESTree.Node, exported: string, kind: 'type' | 'value') => {
    const scope = source.getScope(node);
    const findVariable = kind === 'type' ? findTypeVariable : findValueVariable;
    const declarations = matching.filter((declaration) => {
      return kind === 'type' || declaration.importKind !== 'type';
    });

    const existing = declarations
      .flatMap((declaration) => {
        return declaration.specifiers;
      })
      .find((specifier) => {
        const variable = findVariable(scope, specifier.local.name);

        if (
          !variable?.defs.some((definition) => {
            return definition.node === specifier;
          })
        ) {
          return false;
        }

        if (specifier.type === Node.ImportNamespaceSpecifier) {
          return true;
        }

        return (
          specifier.type === Node.ImportSpecifier &&
          (kind === 'type' || specifier.importKind !== 'type') &&
          (specifier.imported.type === Node.Identifier
            ? specifier.imported.name
            : specifier.imported.value) === exported
        );
      });

    if (existing) {
      const local = existing.local.name;

      return {
        name:
          existing.type === Node.ImportNamespaceSpecifier
            ? `${local}.${exported}`
            : local,
      };
    }

    if (kind === 'value' && filename.endsWith('.cts')) {
      return undefined;
    }

    if (
      !/\.[mc]ts$/u.test(filename) &&
      !source.ast.body.some((statement) => {
        return (
          statement.type === Node.ImportDeclaration ||
          statement.type === Node.ExportNamedDeclaration ||
          statement.type === Node.ExportDefaultDeclaration ||
          statement.type === Node.ExportAllDeclaration ||
          statement.type === Node.TSExportAssignment ||
          statement.type === Node.TSImportEqualsDeclaration
        );
      })
    ) {
      return undefined;
    }

    let name = exported;
    const alias = exported === 'guard' ? 'gostGuard' : `Gost${exported}`;

    if (identifiers.has(name) || scope.set.has(name)) {
      name = alias;

      for (
        let index = 2;
        identifiers.has(name) || scope.set.has(name);
        index += 1
      ) {
        name = `${alias}${index}`;
      }
    }

    const specifier = name === exported ? exported : `${exported} as ${name}`;

    return {
      name,
      add: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix => {
        const declaration = declarations.find((item) => {
          return item.specifiers.at(-1)?.type === Node.ImportSpecifier;
        });
        const last = declaration?.specifiers.at(-1);

        if (declaration && last) {
          const modifier =
            kind === 'type' && declaration.importKind !== 'type' ? 'type ' : '';

          return fixer.insertTextAfter(last, `, ${modifier}${specifier}`);
        }

        const modifier = kind === 'type' ? 'type ' : '';
        const statement = `import ${modifier}{ ${specifier} } from ${quotes}${path}${quotes};`;
        const lastImport = imports.at(-1);

        if (lastImport) {
          const trailing = source
            .getCommentsAfter(lastImport)
            .findLast((comment) => {
              return comment.loc.start.line === lastImport.loc.end.line;
            });

          return fixer.insertTextAfter(
            trailing ?? lastImport,
            `\n${statement}`,
          );
        }

        const firstStatement = source.ast.body.find((statement) => {
          return (
            statement.type !== Node.ExpressionStatement || !statement.directive
          );
        });

        if (firstStatement) {
          const attached = source
            .getCommentsBefore(firstStatement)
            .find((comment) => {
              return (
                (comment.type === 'Block' && comment.value.startsWith('*')) ||
                /(?:@ts-ignore|@ts-expect-error|eslint-disable-next-line|prettier-ignore)/u.test(
                  comment.value,
                )
              );
            });

          return fixer.insertTextBefore(
            attached ?? firstStatement,
            `${statement}\n`,
          );
        }

        return fixer.insertTextAfter(source.ast, `\n${statement}\n`);
      },
    };
  };
};
