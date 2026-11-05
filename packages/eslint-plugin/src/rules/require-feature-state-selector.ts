import {
  svelteScripts,
  scriptHasAttribute,
  inScript,
} from '../lib/svelte-scripts';
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { memberKey } from '../lib/member-key';
import { createStoreStateCheck } from '../lib/store-state';
import { reactiveContext } from '../lib/reactive-context';
import { createRawStateCheck } from '../lib/raw-state';
import { selectorFix } from '../lib/selector-fix';

export const requireFeatureStateSelector = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: { description: 'Select Store state before reactive calls.' },
    schema: [],
    fixable: 'code',
    messages: {
      selectFeature:
        'Select the feature with a separate $derived before computing its presentation: const user = $derived(store.state.user); const view = $derived(presenter(user)); This skips downstream updates when the feature reference is unchanged.',
    },
  },
  defaultOptions: [],
  create(context) {
    const typedScripts = svelteScripts(context.sourceCode)?.filter((script) => {
      return scriptHasAttribute(script, 'lang', 'ts');
    });

    if (typedScripts?.length === 0) {
      return {};
    }

    const services = ESLintUtils.getParserServices(context);
    const isStore = createStoreStateCheck(services);
    const isRawState = createRawStateCheck(context.sourceCode);

    return {
      MemberExpression(node) {
        if (typedScripts && !inScript(node, typedScripts)) {
          return;
        }

        const storeState = memberKey(node) === 'state' && isStore(node.object);

        if (!storeState && !isRawState(node.object)) {
          return;
        }

        const reactive = reactiveContext(node, context.sourceCode);

        if (!reactive) {
          return;
        }

        const parent = node.parent;
        const location =
          storeState &&
          parent.type === AST_NODE_TYPES.MemberExpression &&
          parent.object === node
            ? parent
            : node;

        context.report({
          node: location,
          messageId: 'selectFeature',
          fix:
            reactive.call.type === AST_NODE_TYPES.CallExpression
              ? selectorFix(
                  storeState ? node : node.object,
                  reactive.derived,
                  reactive.call,
                  context.sourceCode,
                )
              : undefined,
        });
      },
    };
  },
});
