import {
  AST_NODE_TYPES as Node,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { commonImportSource, createCommonImport } from '../lib/common-import';
import {
  commonRuleSchema,
  type CommonRuleOptions,
} from '../lib/common-rule-options';
import { findValueVariable } from '../lib/value-variable';

type GuardCheck = {
  method:
    'boolean' | 'string' | 'nlx' | 'ulx' | 'nil' | 'true' | 'false' | 'error';
  value: TSESTree.Expression | TSESTree.PrivateIdentifier;
  negated: boolean;
};

const localVariable = (
  source: TSESLint.SourceCode,
  node: TSESTree.Identifier,
) => {
  const variable = findValueVariable(source.getScope(node), node.name);
  const definition = variable?.defs[0];

  if (!definition) {
    return undefined;
  }

  for (
    let current: TSESTree.Node = definition.node;
    current.type !== Node.Program;
    current = current.parent
  ) {
    if (
      ('declare' in current && current.declare === true) ||
      current.type === Node.TSDeclareFunction ||
      (current.type === Node.TSModuleDeclaration && current.kind === 'global')
    ) {
      return undefined;
    }
  }

  return variable;
};

const unwrap = (node: TSESTree.Expression): TSESTree.Expression => {
  if (
    node.type === Node.TSAsExpression ||
    node.type === Node.TSTypeAssertion ||
    node.type === Node.TSNonNullExpression ||
    node.type === Node.TSSatisfiesExpression ||
    node.type === Node.TSInstantiationExpression ||
    node.type === Node.ChainExpression
  ) {
    return unwrap(node.expression);
  }

  return node;
};

const preservesNarrowing = (
  source: TSESLint.SourceCode,
  check: GuardCheck,
): boolean => {
  if (check.value.type === Node.PrivateIdentifier) {
    return false;
  }

  const value = unwrap(check.value);

  if (value.type === Node.MemberExpression) {
    return false;
  }

  const booleanLiteral = check.method === 'true' || check.method === 'false';

  if (value.type !== Node.Identifier) {
    return !booleanLiteral || value.type === Node.Literal;
  }

  const definition = findValueVariable(source.getScope(value), value.name)
    ?.defs[0];

  if (definition?.type === 'Parameter') {
    for (
      let current: TSESTree.Node = definition.name;
      current !== definition.node && current.type !== Node.Program;
      current = current.parent
    ) {
      if (
        current.type === Node.ObjectPattern ||
        current.type === Node.ArrayPattern
      ) {
        return false;
      }
    }
  }

  if (definition?.type === 'Variable') {
    const { id, init } = definition.node;

    if (id.type !== Node.Identifier) {
      return false;
    }

    if (init && definition.parent.kind === 'const') {
      const initializer = unwrap(init);

      if (
        initializer.type === Node.MemberExpression ||
        initializer.type === Node.Identifier
      ) {
        return false;
      }

      if (booleanLiteral) {
        return initializer.type === Node.Literal;
      }
    }
  }

  return true;
};

const checkOperand = (
  source: TSESLint.SourceCode,
  candidate: TSESTree.Expression | TSESTree.PrivateIdentifier,
  value: TSESTree.Expression | TSESTree.PrivateIdentifier,
  negated: boolean,
): GuardCheck | undefined => {
  if (
    value.type === Node.UnaryExpression &&
    value.operator === 'typeof' &&
    candidate.type === Node.Literal &&
    (candidate.value === 'string' || candidate.value === 'boolean')
  ) {
    const argument = unwrap(value.argument);

    if (argument.type === Node.Identifier && !localVariable(source, argument)) {
      return undefined;
    }

    return { method: candidate.value, value: value.argument, negated };
  }

  if (candidate.type === Node.Literal) {
    switch (candidate.value) {
      case null:
        return { method: 'nlx', value, negated };
      case true:
        return { method: 'true', value, negated };
      case false:
        return { method: 'false', value, negated };
    }
  }

  if (candidate.type === Node.Identifier && candidate.name === 'undefined') {
    const variable = findValueVariable(source.getScope(candidate), 'undefined');

    if (!variable || variable.defs.length === 0) {
      return { method: 'ulx', value, negated };
    }
  }

  return undefined;
};

const equalityCheck = (
  source: TSESLint.SourceCode,
  node: TSESTree.BinaryExpression,
): GuardCheck | undefined => {
  if (
    node.operator === 'instanceof' &&
    node.right.type === Node.Identifier &&
    node.right.name === 'Error' &&
    !findValueVariable(source.getScope(node.right), 'Error')?.defs.length
  ) {
    return { method: 'error', value: node.left, negated: false };
  }

  if (node.operator !== '===' && node.operator !== '!==') {
    return undefined;
  }

  const negated = node.operator === '!==';

  return (
    checkOperand(source, node.left, node.right, negated) ??
    checkOperand(source, node.right, node.left, negated)
  );
};

const nilCheck = (
  source: TSESLint.SourceCode,
  node: TSESTree.LogicalExpression,
): GuardCheck | undefined => {
  if (
    (node.operator !== '||' && node.operator !== '&&') ||
    node.left.type !== Node.BinaryExpression ||
    node.right.type !== Node.BinaryExpression
  ) {
    return undefined;
  }

  const left = equalityCheck(source, node.left);
  const right = equalityCheck(source, node.right);
  const negated = node.operator === '&&';

  if (
    !left ||
    !right ||
    left.negated !== negated ||
    right.negated !== negated ||
    !(
      (left.method === 'nlx' && right.method === 'ulx') ||
      (left.method === 'ulx' && right.method === 'nlx')
    ) ||
    left.value.type !== Node.Identifier ||
    right.value.type !== Node.Identifier ||
    left.value.name !== right.value.name ||
    !localVariable(source, left.value)
  ) {
    return undefined;
  }

  return { method: 'nil', value: left.value, negated };
};

export const preferGuard = ESLintUtils.RuleCreator.withoutDocs<
  CommonRuleOptions,
  'preferGuard'
>({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [...commonRuleSchema],
    messages: { preferGuard: 'Use guard.{{method}} from {{source}}.' },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const source = context.sourceCode;
    const importFor = createCommonImport(source, context.filename);
    const path = commonImportSource(
      context.filename,
      options?.commonRoot,
      'guard',
    );
    const program = source.parserServices?.program;
    const compilerOptions = program?.getCompilerOptions();
    const strictNullChecks =
      !compilerOptions ||
      (compilerOptions.strictNullChecks ?? compilerOptions.strict ?? false);
    const combined = new WeakSet<TSESTree.Node>();

    const report = (node: TSESTree.Expression, check: GuardCheck) => {
      if (
        (!strictNullChecks &&
          (check.method === 'nlx' ||
            check.method === 'ulx' ||
            check.method === 'nil')) ||
        !preservesNarrowing(source, check)
      ) {
        return;
      }

      const useImport = importFor(node);

      if (!useImport) {
        return;
      }

      context.report({
        node,
        messageId: 'preferGuard',
        data: { method: check.method, source: path },
        fix:
          source.getCommentsInside(node).length > 0
            ? null
            : (fixer) => {
                const binding = useImport(path, 'guard', 'value');

                if (!binding) {
                  return null;
                }

                const value = source.getText(check.value);
                const argument =
                  check.value.type === Node.SequenceExpression
                    ? `(${value})`
                    : value;
                const call = `${binding.name}.${check.method}(${argument})`;
                const replacement = fixer.replaceText(
                  node,
                  check.negated ? `!${call}` : call,
                );

                return binding.add
                  ? [...binding.add(fixer), replacement]
                  : replacement;
              },
      });
    };

    return {
      LogicalExpression(node) {
        const check = nilCheck(source, node);

        if (check) {
          combined.add(node.left);
          combined.add(node.right);
          report(node, check);
        }
      },
      BinaryExpression(node) {
        if (combined.has(node)) {
          return;
        }

        const check = equalityCheck(source, node);

        if (check) {
          report(node, check);
        }
      },
    };
  },
});
