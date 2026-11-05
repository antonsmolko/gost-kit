---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add opt-in single-intent-dispatch for typed business UI callbacks, using public
Dispatch declaration/signature provenance. Diagnose multiple dispatches or
conditional intent selection without autofix. Keep the shared Svelte factory
default off and allow consumer UI-Kit exclusions through ordinary overrides.
