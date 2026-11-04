import type { AST } from 'svelte-eslint-parser';
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
    const parserServices = context.sourceCode.parserServices;

    if (
      parserServices &&
      'isSvelte' in parserServices &&
      parserServices.isSvelte === true
    ) {
      // Svelte extends ESTree with script elements that TSESTree does not model.
      const program = context.sourceCode.ast as unknown as AST.SvelteProgram;
      const typedScript = program.body.some((node) => {
        return (
          node.type === 'SvelteScriptElement' &&
          node.startTag.attributes.some((attribute) => {
            return (
              attribute.type === 'SvelteAttribute' &&
              attribute.key.name === 'lang' &&
              attribute.value.some((value) => {
                return value.type === 'SvelteLiteral' && value.value === 'ts';
              })
            );
          })
        );
      });

      if (!typedScript) {
        return {};
      }
    }

    const services = ESLintUtils.getParserServices(context);
    const isStore = createStoreStateCheck(services, context.filename);
    const isRawState = createRawStateCheck(context.sourceCode);

    return {
      MemberExpression(node) {
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
          fix: selectorFix(
            storeState ? node : node.object,
            reactive.derived,
            reactive.call,
            context.sourceCode,
          ),
        });
      },
    };
  },
});
