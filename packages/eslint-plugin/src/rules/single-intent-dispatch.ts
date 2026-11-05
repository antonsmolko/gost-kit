import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';
import { createDispatchCheck } from '../lib/dispatch-type';
import { createUiHandlerCollector } from '../lib/ui-handlers';
import { visitHandlerBody } from '../lib/handler-body';
import { scriptHasAttribute, svelteScripts } from '../lib/svelte-scripts';

export const singleIntentDispatch = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: { description: 'Forward one intent in business UI callbacks.' },
    schema: [],
    messages: {
      multipleDispatch:
        'Forward one intent action; move business transitions to the reducer.',
      conditionalDispatch:
        'Move business decisions to the reducer and browser event handling to a UI-Kit component.',
    },
  },
  defaultOptions: [],
  create(context) {
    const source = context.sourceCode;
    const scripts = svelteScripts(source)?.filter((script) => {
      return (
        scriptHasAttribute(script, 'lang', 'ts') &&
        !scriptHasAttribute(script, 'module') &&
        !scriptHasAttribute(script, 'context', 'module')
      );
    });

    if (!scripts?.length) {
      return {};
    }

    const isDispatch = createDispatchCheck(
      ESLintUtils.getParserServices(context),
    );
    const collector = createUiHandlerCollector(source, scripts);

    return {
      SvelteAttribute: collector.attribute,
      SvelteShorthandAttribute: collector.shorthand,
      SvelteDirective: collector.directive,
      'Program:exit'() {
        collector.handlers.forEach((handler) => {
          let calls = 0;
          let condition: TSESTree.Node | undefined;

          if (!handler.body) {
            return;
          }

          visitHandlerBody(handler.body, source, (node) => {
            if (
              node.type === AST_NODE_TYPES.CallExpression &&
              isDispatch(node.callee)
            ) {
              calls += 1;
            }

            if (
              node.type === AST_NODE_TYPES.IfStatement ||
              node.type === AST_NODE_TYPES.SwitchStatement ||
              node.type === AST_NODE_TYPES.ForStatement ||
              node.type === AST_NODE_TYPES.ForInStatement ||
              node.type === AST_NODE_TYPES.ForOfStatement ||
              node.type === AST_NODE_TYPES.WhileStatement ||
              node.type === AST_NODE_TYPES.DoWhileStatement ||
              node.type === AST_NODE_TYPES.ConditionalExpression ||
              node.type === AST_NODE_TYPES.LogicalExpression
            ) {
              condition ??= node;
            }
          });

          if (calls > 1) {
            context.report({ node: handler, messageId: 'multipleDispatch' });
          } else if (calls === 1 && condition) {
            context.report({
              node: condition,
              messageId: 'conditionalDispatch',
            });
          }
        });
      },
    };
  },
});
