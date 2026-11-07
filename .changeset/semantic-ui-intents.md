---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add opt-in single-intent-dispatch for typed business UI callbacks, using public
Dispatch declaration/signature provenance. Diagnose multiple dispatches or
conditional intent selection without autofix. Keep the shared Svelte factory
default off and allow consumer UI-Kit exclusions through ordinary overrides.

Include optional calls/accesses that gate Dispatch in conditional-delivery
diagnostics, without treating unrelated optional data reads as dispatch gates.
Document the on-prefix and whole-handler syntactic-policy boundaries explicitly.
