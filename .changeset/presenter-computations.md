---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add the opt-in gost/require-presenter rule for derived bindings and template display computations, resolving TypeScript presenter declarations through aliases and public exports. Register it off in the shared Svelte configuration. Extend typed feature-state selector diagnostics to template const computations without template autofix.
