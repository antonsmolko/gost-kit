# @gost-kit/eslint-plugin

ESLint rules for reactive state selection, presenters and UI handlers.
Use them to check selected application components while keeping independent
UI-Kit components under their own state policy.

## Install

Requires Node 26.x (`^26.0.0`), ESLint `^10.14.0` and TypeScript `^5.9.3`.
The example also needs Svelte 5, the Svelte parser and jiti to load a TypeScript config.

```sh
npm install -D @gost-kit/eslint-plugin eslint typescript svelte svelte-eslint-parser jiti
```

For a complete Svelte/TypeScript configuration, use
[@gost-kit/eslint-config-svelte](https://www.npmjs.com/package/@gost-kit/eslint-config-svelte)
instead. It includes this plugin and enables the selector rule; the other four
rules require explicit opt-in.

## Use a rule directly

This minimal `eslint.config.ts` enables the syntax-only component-state rule.
It does not need TypeScript parser services:

```ts
import { plugin } from '@gost-kit/eslint-plugin';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    files: ['src/**/*.svelte'],
    languageOptions: { parser: svelteParser },
    plugins: { gost: plugin },
    rules: { 'gost/no-component-state': 'error' },
  },
  {
    files: ['src/ui-kit/**/*.svelte'],
    rules: { 'gost/no-component-state': 'off' },
  },
];
```

For example, `src/Panel.svelte`:

```svelte
<script>
  let open = $state(false);
</script>

<p>{open}</p>
```

```sh
npx eslint src/Panel.svelte
```

The rule reports component-owned state. Move business state into root/feature
state, or exclude the file if it is an independent UI component. The direct
example parses JavaScript scripts only; use the shared Svelte config for
lang="ts" components and typed rules.

## Rules

The full contracts and examples are in [RULES.md](RULES.md).

| Rule                           | Checks                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| require-feature-state-selector | Direct replaceable Store/raw inputs to calls inside derived and typed template const bindings.              |
| no-component-state             | Intrinsic $state, $state.raw and $bindable creation, allowing simple empty bind:this refs.                  |
| single-intent-dispatch         | Multiple or conditional genuine Dispatch calls in discovered UI handlers.                                   |
| ready-boolean-condition        | Ready boolean literals/reads in if/else-if; computations and nullable truthiness report.                    |
| require-presenter              | Calculations in derived and template display slots; presenter bindings resolve *.presenter.ts declarations. |

The selector supports conservative autofix for simple derived declarations.
Template const diagnostics and the other rules have no autofix.

## Type information and limits

Store/Dispatch detection uses the public @gost-kit/common declaration provenance
in the consumer's TypeScript program, including nested installations.
The plugin does not install common or Svelte application runtime dependencies.
Explicit local $state.raw bindings are recognized lexically; types alone cannot
distinguish a reactive value from an ordinary object.

Typed checks need real parser services. Boolean reads also require strictNullChecks;
candidate presenter calls need a TypeScript program. The shared Svelte config
supplies parser/project setup. Missing services produce configuration errors
when a rule needs them.

Selector checks skip JS-script/stateless components and inspect mixed components
per typed script. The shared config registers GOST rules for .svelte and
.svelte.ts, not .svelte.js. Handler discovery uses an on* name heuristic, so
function props such as once/only can also qualify. Conditional-delivery checks
are syntactic, including conditions after a dispatch; they are not control-flow
proof. Presenter provenance does not prove purity or trace hidden helper logic.
Consult RULES for exact contexts and exclusions.
