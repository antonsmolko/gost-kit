---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add the opt-in ready-boolean-condition rule for Svelte if/else-if conditions.
Accept ready boolean reads and literals, report computations/truthiness, and
require typed parser services with strictNullChecks for reads. The Svelte config
registers the rule off; projects select business/UI-Kit scopes explicitly.
