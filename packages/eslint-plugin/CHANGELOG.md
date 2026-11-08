# @gost-kit/eslint-plugin

## 0.2.0

### Minor Changes

- 9f59da3: Add the opt-in ready-boolean-condition rule for Svelte if/else-if conditions.
  Accept ready boolean reads and literals, report computations/truthiness, and
  require typed parser services with strictNullChecks for reads. The Svelte config
  registers the rule off; projects select business/UI-Kit scopes explicitly.

## 0.1.0

### Minor Changes

- 11cc6af: Add opt-in no-component-state diagnostics for state and bindable rune creation,
  with binding-aware empty bind:this ref exceptions and no autofix. Keep the
  public Svelte factory policy unchanged; consumers select application and UI-Kit
  scopes with explicit ESLint overrides.

  Reuse value-namespace rune resolution in the existing selector rule so type-only
  names/imports do not hide derived or raw-state diagnostics. Consolidate rune and
  Svelte script matching; document explicit plugin registration for extra JS scopes.

- d6883b7: Add the typed require-feature-state-selector architecture rule for GOST Store
  and explicit local Svelte raw state. Enable it in typed Svelte config scopes,
  with conservative selector autofix and V2/V3 collision-safe names.
- 730b73a: Add opt-in single-intent-dispatch for typed business UI callbacks, using public
  Dispatch declaration/signature provenance. Diagnose multiple dispatches or
  conditional intent selection without autofix. Keep the shared Svelte factory
  default off and allow consumer UI-Kit exclusions through ordinary overrides.

  Include optional calls/accesses that gate Dispatch in conditional-delivery
  diagnostics, without treating unrelated optional data reads as dispatch gates.
  Document the on-prefix and whole-handler syntactic-policy boundaries explicitly.
