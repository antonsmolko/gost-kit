import {
  AST_NODE_TYPES as Node,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';
import { commonImportSource, createCommonImport } from '../lib/common-import';
import {
  commonRuleSchema,
  type CommonRuleOptions,
} from '../lib/common-rule-options';

const introducesInference = (node: TSESTree.TSUnionType) => {
  for (
    let current: TSESTree.Node = node;
    current.parent;
    current = current.parent
  ) {
    if (
      current.parent.type === Node.TSConditionalType &&
      current.parent.extendsType === current
    ) {
      return true;
    }
  }

  return false;
};

const unionMembers = (node: TSESTree.TypeNode): TSESTree.TypeNode[] => {
  return node.type === Node.TSUnionType
    ? node.types.flatMap(unionMembers)
    : [node];
};

const needsParens = (node: TSESTree.TypeNode) => {
  return (
    node.type === Node.TSFunctionType ||
    node.type === Node.TSConstructorType ||
    node.type === Node.TSConditionalType
  );
};

export const preferNullishTypes = ESLintUtils.RuleCreator.withoutDocs<
  CommonRuleOptions,
  'preferAlias'
>({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [...commonRuleSchema],
    messages: {
      preferAlias: 'Use {{name}} from @gost-kit/common for this union.',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const source = context.sourceCode;
    const useImport = createCommonImport(
      source,
      commonImportSource(context.filename, options?.commonRoot, 'types'),
      context.filename,
    );

    return {
      TSUnionType(node) {
        if (node.parent.type === Node.TSUnionType) {
          return;
        }

        const members = unionMembers(node);
        const types = members.filter((type) => {
          return (
            type.type !== Node.TSNullKeyword &&
            type.type !== Node.TSUndefinedKeyword
          );
        });

        if (
          types.length === 0 ||
          types.length === members.length ||
          introducesInference(node)
        ) {
          return;
        }

        const hasNull = members.some((type) => {
          return type.type === Node.TSNullKeyword;
        });
        const hasUndefined = members.some((type) => {
          return type.type === Node.TSUndefinedKeyword;
        });
        const name = hasNull && hasUndefined ? 'Nil' : hasNull ? 'Nlx' : 'Ulx';
        const canFix = source.getCommentsInside(node).length === 0;

        context.report({
          node,
          messageId: 'preferAlias',
          data: { name },
          fix: canFix
            ? (fixer) => {
                const binding = useImport(node, name, 'type');

                if (!binding) {
                  return null;
                }

                const generic = types
                  .map((type) => {
                    const text = source.getText(type);

                    return types.length > 1 && needsParens(type)
                      ? `(${text})`
                      : text;
                  })
                  .join(' | ');
                const replacement = fixer.replaceText(
                  node,
                  `${binding.name}<${generic}>`,
                );

                return binding.add
                  ? [binding.add(fixer), replacement]
                  : replacement;
              }
            : null,
        });
      },
    };
  },
});
