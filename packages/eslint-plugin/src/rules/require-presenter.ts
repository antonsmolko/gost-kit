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
import { readyValue, readyPattern } from '../lib/ready-value';
import type { AST } from 'svelte-eslint-parser';
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

    const display = (node: TSESTree.Node) => {
      if (!readyValue(node)) {
        context.report({ node, messageId: 'requirePresenter' });
      }
    };

    return {
      SvelteMustacheTag(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteMustacheTag;

        if (
          node.parent.type === 'SvelteAttribute' &&
          node.parent.key.name.startsWith('on') &&
          node.parent.key.name.length > 2
        ) {
          return;
        }
        display(node.expression as TSESTree.Node);
      },
      SvelteSpreadAttribute(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteSpreadAttribute;

        display(node.argument as TSESTree.Node);
      },
      SvelteDirective(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteDirective;

        if (node.kind === 'Class' && node.expression) {
          display(node.expression as TSESTree.Node);
        }
      },
      SvelteSpecialDirective(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteSpecialDirective;

        display(node.expression as TSESTree.Node);
      },
      SvelteEachBlock(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteEachBlock;

        display(node.expression as TSESTree.Node);

        if (node.key) {
          display(node.key as TSESTree.Node);
        }
      },
      SvelteKeyBlock(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteKeyBlock;

        display(node.expression as TSESTree.Node);
      },
      SvelteConstTag(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteConstTag;

        if (
          !node.declarations.every((declaration) => {
            return (
              readyPattern(declaration.id as TSESTree.Node) &&
              !!declaration.init &&
              isReady(declaration.init as TSESTree.Node)
            );
          })
        ) {
          context.report({ node: raw, messageId: 'requirePresenter' });
        }
      },
      SvelteRenderTag(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteRenderTag;
        const call = (
          node.expression.type === 'ChainExpression'
            ? node.expression.expression
            : node.expression
        ) as TSESTree.CallExpression;

        if (
          !readyValue(call.callee) ||
          !call.arguments.every((argument) => {
            return readyValue(argument);
          })
        ) {
          context.report({ node: raw, messageId: 'requirePresenter' });
        }
      },
      SvelteSnippetBlock(raw: TSESTree.Node) {
        const node = raw as unknown as AST.SvelteSnippetBlock;

        node.params.forEach((param) => {
          if (!readyPattern(param as TSESTree.Node, isReady)) {
            context.report({
              node: param as TSESTree.Node,
              messageId: 'requirePresenter',
            });
          }
        });
      },
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
