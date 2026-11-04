# Svelte rule inventory

Pinned baseline: eslint-plugin-svelte 3.24.0, svelte-eslint-parser 1.10.1,
Svelte 5.57.2. All selected rules are errors on components and rune modules.
Common JS/TS policies are inherited, not duplicated here.

| Policy | Rule                                           | Level/options                                              |
| ------ | ---------------------------------------------- | ---------------------------------------------------------- |
| S01    | `svelte/no-dupe-else-if-blocks`                | `["error"]`                                                |
| S02    | `svelte/no-not-function-handler`               | `["error"]`                                                |
| S03    | `svelte/no-object-in-text-mustaches`           | `["error"]`                                                |
| S04    | `svelte/require-each-key`                      | `["error"]`                                                |
| S04    | `svelte/valid-each-key`                        | `["error"]`                                                |
| S05    | `svelte/button-has-type`                       | `["error"]`                                                |
| S06    | `svelte/no-bind-value-on-checkable-inputs`     | `["error"]`                                                |
| S07    | `svelte/no-dupe-style-properties`              | `["error"]`                                                |
| S07    | `svelte/no-shorthand-style-property-overrides` | `["error"]`                                                |
| S07    | `svelte/no-unknown-style-directive-property`   | `["error"]`                                                |
| S08    | `svelte/no-conflicting-module-names`           | `["error"]`                                                |
| S09    | `svelte/no-svelte-internal`                    | `["error"]`                                                |
| S10    | `svelte/no-at-debug-tags`                      | `["error"]`                                                |
| S10    | `svelte/no-inspect`                            | `["error"]`                                                |
| S11    | `svelte/no-unused-svelte-ignore`               | `["error"]`                                                |
| S11    | `svelte/no-unused-props`                       | `["error"]`                                                |
| S12    | `svelte/no-unnecessary-state-wrap`             | `["error"]`                                                |
| S13    | `svelte/prefer-derived-over-derived-by`        | `["error"]`                                                |
| S14    | `svelte/prefer-writable-derived`               | `["error"]`                                                |
| AS01   | `svelte/no-at-html-tags`                       | `["error"]`                                                |
| AS02   | `svelte/block-lang`                            | `["error", {"script":"ts", "enforceScriptPresent":false}]` |
| AS03   | `svelte/no-store-async`                        | `["error"]`                                                |
| AS03   | `svelte/no-ignored-unsubscribe`                | `["error"]`                                                |

Infrastructure rules `svelte/comment-directive` and `svelte/system` are inherited
from Svelte base. The base and Prettier compatibility layers do not implicitly
activate the recommended Svelte/Kit policy set. Ordinary JS/TS files keep the
common baseline; selected framework rules target `**/*.svelte`, `**/*.svelte.ts`
and `**/*.svelte.js` where the upstream rule supports the corresponding syntax.

Not enabled: AS04 DOM/listener restrictions, AS05 SSR browser-global restrictions,
AS06 prefer-svelte-reactivity, legacy recommended/experimental rules and SvelteKit
routing rules. Prettier owns HTML/CSS formatting. Architecture checks #16–#19 remain separate outcomes.

The bundled GOST plugin additionally enables `gost/require-feature-state-selector`
at error for TypeScript component scripts and `.svelte.ts`. It checks public
Store state and explicit local `$state.raw` before reactive computation calls,
with limited autofix. JS scripts and `.svelte.js` are excluded from this typed
rule. See [the plugin inventory](../eslint-plugin/RULES.md) for its boundaries.

Sources: [rule catalog](https://sveltejs.github.io/eslint-plugin-svelte/rules/),
[configuration boundaries](https://sveltejs.github.io/eslint-plugin-svelte/user-guide/).
Recalculate configs and review selected/inherited rule changes when upgrading.
