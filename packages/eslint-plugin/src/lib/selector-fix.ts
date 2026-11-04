import type { AST } from 'svelte-eslint-parser';
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { memberKey } from './member-key';

const reserved = new Set([
  'arguments',
  'eval',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

// A deliberately small syntax boundary: a standalone derived with one direct call.
export const selectorFix = (
  state: TSESTree.Expression,
  derived: TSESTree.CallExpression,
  call: TSESTree.CallExpression,
  source: TSESLint.SourceCode,
): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix[]) | undefined => {
  if (
    derived.callee.type !== AST_NODE_TYPES.Identifier ||
    derived.arguments[0] !== call ||
    call.optional ||
    call.callee.type !== AST_NODE_TYPES.Identifier ||
    call.arguments.length !== 1
  ) {
    return undefined;
  }

  const selected = call.arguments[0];
  const declarator = derived.parent;
  const declaration = declarator?.parent;

  if (
    selected.type !== AST_NODE_TYPES.MemberExpression ||
    declarator?.type !== AST_NODE_TYPES.VariableDeclarator ||
    declarator.init !== derived ||
    declaration?.type !== AST_NODE_TYPES.VariableDeclaration ||
    declaration.declarations.length !== 1 ||
    declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    declaration.parent.type === AST_NODE_TYPES.ForStatement ||
    declaration.parent.type === AST_NODE_TYPES.ForOfStatement ||
    declaration.parent.type === AST_NODE_TYPES.ForInStatement
  ) {
    return undefined;
  }

  // Accept one immediate feature property only; deeper user-defined getters
  // and accesses through containers have no static purity guarantee.
  if (
    selected.object !== state ||
    (state.type !== AST_NODE_TYPES.Identifier &&
      (state.type !== AST_NODE_TYPES.MemberExpression ||
        state.object.type !== AST_NODE_TYPES.Identifier ||
        state.optional)) ||
    selected.optional
  ) {
    return undefined;
  }

  const base = memberKey(selected);

  if (!base || base.startsWith('$') || !/^[A-Z_a-z][$\w]*$/u.test(base)) {
    return undefined;
  }

  const occupied = new Set<string>();
  let scope: TSESLint.Scope.Scope | null = source.getScope(declaration);

  while (scope) {
    scope.variables.forEach((variable) => {
      occupied.add(variable.name);
    });

    scope.through.forEach((reference) => {
      occupied.add(reference.identifier.name);
    });

    scope = scope.upper;
  }

  let name = base;
  let version = 2;

  while (occupied.has(name) || reserved.has(name)) {
    name = `${base}V${version}`;
    version += 1;
  }

  // Svelte adds script elements to ESTree; its parser supplies this parent.
  const parent = declaration.parent as TSESTree.Node | AST.SvelteScriptElement;

  if (
    parent.type !== AST_NODE_TYPES.Program &&
    parent.type !== 'SvelteScriptElement'
  ) {
    return undefined;
  }

  const indentation = source.lines[declaration.loc.start.line - 1].slice(
    0,
    declaration.loc.start.column,
  );
  const leading = /^\s*$/u.test(indentation) ? indentation : '';
  const lineEnd = source.text.includes('\r\n') ? '\r\n' : '\n';

  return (fixer) => {
    return [
      fixer.insertTextBefore(
        declaration,
        `const ${name} = $derived(${source.getText(selected)});${lineEnd}${leading}`,
      ),
      fixer.replaceText(selected, name),
    ];
  };
};
