---
'@gost-kit/eslint-plugin': minor
'@gost-kit/eslint-config-svelte': patch
---

Add opt-in no-component-state diagnostics for state and bindable rune creation,
with binding-aware empty bind:this ref exceptions and no autofix. Keep the
public Svelte factory policy unchanged; consumers select application and UI-Kit
scopes with explicit ESLint overrides.

Reuse value-namespace rune resolution in the existing selector rule so type-only
names/imports do not hide derived or raw-state diagnostics. Consolidate rune and
Svelte script matching; document explicit plugin registration for extra JS scopes.
