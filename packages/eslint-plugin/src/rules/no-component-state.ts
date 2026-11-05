import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';
import { runeCallee } from '../lib/rune-callee';
import { createComponentRefCheck } from '../lib/component-refs';

export const noComponentState = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow component-owned logical state in explicitly selected files.',
    },
    schema: [],
    messages: {
      componentState:
        '{{rune}} creates component-owned state. Move logical state to root/feature state and use intent actions, or exclude this independent UI component from the rule scope.',
    },
  },
  defaultOptions: [],
  create(context) {
    const source = context.sourceCode;
    const refs = createComponentRefCheck(source);
    const calls: { node: TSESTree.CallExpression; rune: string }[] = [];

    return {
      SvelteDirective: refs.recordBinding,
      CallExpression(node) {
        const callee = node.callee;
        const identifier =
          runeCallee(callee, source, '$state', 'raw') ??
          runeCallee(callee, source, '$bindable');

        if (!identifier) {
          return;
        }

        calls.push({
          node,
          rune:
            callee.type === AST_NODE_TYPES.MemberExpression
              ? '$state.raw'
              : identifier.name,
        });
      },
      'Program:exit'() {
        calls.forEach(({ node, rune }) => {
          if (rune !== '$bindable' && refs.allows(node)) {
            return;
          }

          context.report({ node, messageId: 'componentState', data: { rune } });
        });
      },
    };
  },
});
