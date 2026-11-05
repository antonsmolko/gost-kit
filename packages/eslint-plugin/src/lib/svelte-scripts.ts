import type { AST } from 'svelte-eslint-parser';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export const svelteScripts = (source: TSESLint.SourceCode) => {
  const services = source.parserServices;

  if (!services || !('isSvelte' in services) || services.isSvelte !== true) {
    return undefined;
  }

  // Only the Svelte parser supplies the extended ESTree script elements.
  return (source.ast as unknown as AST.SvelteProgram).body.filter(
    (node): node is AST.SvelteScriptElement => {
      return node.type === 'SvelteScriptElement';
    },
  );
};

export const scriptHasAttribute = (
  script: AST.SvelteScriptElement,
  name: string,
  value?: string,
): boolean => {
  return script.startTag.attributes.some((attribute) => {
    return (
      attribute.type === 'SvelteAttribute' &&
      attribute.key.name === name &&
      (value === undefined ||
        attribute.value.some((item) => {
          return item.type === 'SvelteLiteral' && item.value === value;
        }))
    );
  });
};

export const inScript = (
  node: TSESTree.Node,
  scripts: readonly AST.SvelteScriptElement[],
): boolean => {
  return scripts.some((script) => {
    return node.range[0] >= script.range[0] && node.range[1] <= script.range[1];
  });
};
