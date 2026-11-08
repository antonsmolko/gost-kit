# @gost-kit/eslint-plugin

GOST architecture rules for frontend development. Independently versioned;
see package.json and the release changelog. Requires Node ^26.0.0,
ESLint ^10.14.0 and TypeScript ^5.9.3.

## Usage

`@gost-kit/eslint-config-svelte` installs and enables the plugin for typed Svelte
components and `.svelte.ts` modules. The selector rule is enabled by default;
`gost/no-component-state`, `gost/single-intent-dispatch` and
`gost/ready-boolean-condition` and `gost/require-presenter` require explicit
consumer overrides for business component paths. UI-Kit paths can opt out.
No separate plugin registration is needed.
Other consumers may register the named public export in their flat config:

```ts
import { plugin } from '@gost-kit/eslint-plugin';

export default [
  // Configure a typed parser and a consumer TypeScript project first.
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    plugins: { gost: plugin },
    rules: { 'gost/require-feature-state-selector': 'error' },
  },
];
```

The plugin does not install application runtime packages. Store detection uses
`@gost-kit/common` types already present in the consumer's TypeScript program.
Nested common installations are supported; a direct common dependency of the
application is not required for inferred Store detection.
Local `$state.raw` bindings are recognized from their original lexical scope.
For `require-feature-state-selector`, type information is required; an enabled typed rule without parser services
reports a configuration error. For the selector rule, stateless and JavaScript-script
components are skipped. Mixed components are checked per script: a typed module script does
not enable the rule for a JavaScript instance script. The Svelte config does not enable this typed rule for `.svelte.js`.

`single-intent-dispatch` uses an `on*` name heuristic, including function-valued
non-event props such as `once`/`only`. Its whole-handler condition policy also
reports conditions after an unconditional Dispatch, without control-flow proof.
Optional invocation/access that gates a genuine Dispatch is conditional delivery;
ordinary optional data reads remain outside that gate check.

See [RULES.md](RULES.md) for diagnostics, autofix boundaries and examples.
Tests and test helpers are excluded from published artifacts.

`ready-boolean-condition` checks Svelte if/else-if conditions: true/false or
ready boolean identifier/static field reads. Computations and truthiness are
reported; typed reads require strictNullChecks and parser services. JS/stateless
reads are checked too when services are available. No autofix or presenter
provenance guarantee is provided. See the inventory for opt-in boundaries.

`require-presenter` moves visible calculations from derived bindings and template
display slots to functions declared in `*.presenter.ts` modules. Named/default
imports and public barrel exports are supported; compiled TypeScript packages use
`*.presenter.d.ts` declarations. Ready reads and containers remain valid.
Presenter calls belong in derived or template const bindings, with ready values
used for display. Typed parser services are required to resolve candidate calls.
The selector rule also checks typed template const computations, without template
autofix. See the inventory for exact contexts and known analysis boundaries.
