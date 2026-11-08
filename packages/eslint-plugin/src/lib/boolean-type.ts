import ts from 'typescript';

export const booleanType = (
  checker: ts.TypeChecker,
  type: ts.Type,
): boolean => {
  if (
    type.flags &
    (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)
  ) {
    return false;
  }

  if (type.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);

    return (
      constraint !== undefined &&
      constraint !== type &&
      booleanType(checker, constraint)
    );
  }

  return checker.isTypeAssignableTo(type, checker.getBooleanType());
};
