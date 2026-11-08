import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';
import { isDerived } from '../lib/reactive-context';
import { memberKey } from '../lib/member-key';
import {
  svelteScripts,
  scriptHasAttribute,
  inScript,
} from '../lib/svelte-scripts';
import { createPresenterCallCheck } from '../lib/presenter-call';
import { readyValue } from '../lib/ready-value';
import { derivedValue } from '../lib/derived-value';

export const requirePresenter = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prepare presentation calculations in TypeScript presenter modules.',
    },
    schema: [],
    messages: {
      requirePresenter:
        'Prepare this value in a *.presenter.ts module; keep ready values and reactive presenter bindings in the component.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (!/\.svelte(?:\.[jt]s)?$/u.test(context.filename)) {
      return {};
    }

    const modules =
      svelteScripts(context.sourceCode)?.filter((script) => {
        return (
          scriptHasAttribute(script, 'module') ||
          scriptHasAttribute(script, 'context', 'module')
        );
      }) ?? [];
    let checkCall: ReturnType<typeof createPresenterCallCheck> | undefined;
    const presenter = (call: TSESTree.CallExpression) => {
      checkCall ??= createPresenterCallCheck(
        ESLintUtils.getParserServices(context),
      );

      return checkCall(call);
    };
    const isReady = (node: TSESTree.Node) => {
      return readyValue(node, presenter);
    };

    return {
      CallExpression(node) {
        if (!isDerived(node, context.sourceCode) || inScript(node, modules)) {
          return;
        }

        const argument = node.arguments[0];
        const by =
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          memberKey(node.callee) === 'by';

        if (
          node.arguments.length !== 1 ||
          !argument ||
          !(by ? derivedValue(argument, isReady) : isReady(argument))
        ) {
          context.report({ node, messageId: 'requirePresenter' });
        }
      },
    };
  },
});
