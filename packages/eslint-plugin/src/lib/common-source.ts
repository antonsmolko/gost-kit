import ts from 'typescript';
import { dirname, join } from 'node:path';

// Identify the package owning the declaration, without requiring a hoisted
// @gost-kit/common import from the consumer's source directory.
export const createCommonSourceCheck = () => {
  const directories = new Map<string, boolean>();
  const isCommonDirectory = (directory: string): boolean => {
    const cached = directories.get(directory);

    if (cached !== undefined) {
      return cached;
    }

    const filename = join(directory, 'package.json');
    const contents = ts.sys.readFile(filename);
    let common = false;

    if (contents !== undefined) {
      const statement = ts.parseJsonText(filename, contents).statements[0];

      if (
        statement &&
        ts.isExpressionStatement(statement) &&
        ts.isObjectLiteralExpression(statement.expression)
      ) {
        common = statement.expression.properties.some((property) => {
          return (
            ts.isPropertyAssignment(property) &&
            ts.isStringLiteral(property.name) &&
            property.name.text === 'name' &&
            ts.isStringLiteral(property.initializer) &&
            property.initializer.text === '@gost-kit/common'
          );
        });
      }
    } else {
      const parent = dirname(directory);

      common = parent !== directory && isCommonDirectory(parent);
    }

    directories.set(directory, common);

    return common;
  };

  return (source: ts.SourceFile): boolean => {
    return isCommonDirectory(dirname(source.fileName));
  };
};
