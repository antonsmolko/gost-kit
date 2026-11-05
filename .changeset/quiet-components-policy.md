---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add opt-in no-component-state diagnostics for state and bindable rune creation,
with binding-aware empty bind:this ref exceptions and no autofix. Keep the
public Svelte factory policy unchanged; consumers select application and UI-Kit
scopes with explicit ESLint overrides.
