import { expect, test } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import config from '../../../eslint.config';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: config,
});

test.each([
  'gost/no-component-state',
  'gost/single-intent-dispatch',
  'gost/ready-boolean-condition',
  'gost/require-presenter',
])('%s applies to business components and is off for UI-Kit', async (rule) => {
  const ui = await eslint.calculateConfigForFile(
    'src/ui-kit/disclosure/ui/Disclosure.svelte',
  );
  const business = await eslint.calculateConfigForFile(
    'src/DisclosureExamples.svelte',
  );

  expect(ui?.rules?.[rule]?.[0]).toBe(0);
  expect(business?.rules?.[rule]?.[0]).toBe(2);
  expect(ui?.rules?.['gost/require-feature-state-selector']?.[0]).toBe(2);
  expect(ui?.rules?.['svelte/button-has-type']?.[0]).toBe(2);
});
