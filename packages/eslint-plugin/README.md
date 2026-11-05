# @gost-kit/eslint-plugin

GOST architecture rules for frontend development. Independently versioned;
see package.json and the release changelog. Requires Node ^26.0.0,
ESLint ^10.14.0 and TypeScript ^5.9.3.

## Usage

`@gost-kit/eslint-config-svelte` installs and enables the plugin for typed Svelte
components and `.svelte.ts` modules. The selector rule is enabled by default;
`gost/no-component-state` and `gost/single-intent-dispatch` require explicit
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
reports a configuration error. Stateless and JavaScript-script components are
skipped. Mixed components are checked per script: a typed module script does
not enable the rule for a JavaScript instance script. The Svelte config does not enable this typed rule for `.svelte.js`.

See [RULES.md](RULES.md) for diagnostics, autofix boundaries and examples.
Tests and test helpers are excluded from published artifacts.
