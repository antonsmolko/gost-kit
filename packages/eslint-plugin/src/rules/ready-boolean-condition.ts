import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';
import { readyBooleanExpression } from '../lib/ready-boolean-expression';
import { booleanType } from '../lib/boolean-type';

export const readyBooleanCondition = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require ready boolean reads in Svelte if/else-if conditions.',
    },
    schema: [],
    messages: {
      readyBoolean:
        'Prepare a named boolean in a presenter and read it here instead of computing a condition or using truthiness.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (!context.filename.endsWith('.svelte')) {
      return {};
    }

    return {
      SvelteIfBlock(node: { expression: TSESTree.Expression }) {
        const expression = node.expression;

        if (
          expression.type === AST_NODE_TYPES.Literal &&
          (expression.value === true || expression.value === false)
        ) {
          return;
        }

        if (!readyBooleanExpression(expression)) {
          context.report({ node: expression, messageId: 'readyBoolean' });

          return;
        }

        const services = ESLintUtils.getParserServices(context);
        const options = services.program.getCompilerOptions();

        if (!(options.strictNullChecks ?? options.strict ?? false)) {
          throw new Error(
            'gost/ready-boolean-condition requires strictNullChecks (or strict) for typed conditions.',
          );
        }

        if (
          !booleanType(
            services.program.getTypeChecker(),
            services.getTypeAtLocation(expression),
          )
        ) {
          context.report({ node: expression, messageId: 'readyBoolean' });
        }
      },
    };
  },
});
