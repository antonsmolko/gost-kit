# @gost-kit/eslint-config-svelte

## 0.2.0

### Minor Changes

- d6883b7: Add the typed require-feature-state-selector architecture rule for GOST Store
  and explicit local Svelte raw state. Enable it in typed Svelte config scopes,
  with conservative selector autofix and V2/V3 collision-safe names.

### Patch Changes

- 11cc6af: Add opt-in no-component-state diagnostics for state and bindable rune creation,
  with binding-aware empty bind:this ref exceptions and no autofix. Keep the
  public Svelte factory policy unchanged; consumers select application and UI-Kit
  scopes with explicit ESLint overrides.

  Reuse value-namespace rune resolution in the existing selector rule so type-only
  names/imports do not hide derived or raw-state diagnostics. Consolidate rune and
  Svelte script matching; document explicit plugin registration for extra JS scopes.

- 6c74d68: Expose a composed TypeScript policy for framework adapters without an ESLint
  reflection instance. Cover JSX/TSX with general checks and remove unused direct
  config dependencies. Reject ambiguous combined Content-Type values while
  preserving commas inside quoted parameters.
- 730b73a: Add opt-in single-intent-dispatch for typed business UI callbacks, using public
  Dispatch declaration/signature provenance. Diagnose multiple dispatches or
  conditional intent selection without autofix. Keep the shared Svelte factory
  default off and allow consumer UI-Kit exclusions through ordinary overrides.

  Include optional calls/accesses that gate Dispatch in conditional-delivery
  diagnostics, without treating unrelated optional data reads as dispatch gates.
  Document the on-prefix and whole-handler syntactic-policy boundaries explicitly.

- Updated dependencies [11cc6af]
- Updated dependencies [d6883b7]
- Updated dependencies [6c74d68]
- Updated dependencies [730b73a]
  - @gost-kit/eslint-plugin@0.1.0
  - @gost-kit/eslint-config@0.2.0

## 0.1.0

### Minor Changes

- 11af11e: Introduce an independently versioned Svelte 5 ESLint configuration with the
  shared JavaScript/TypeScript baseline and explicit component/rune policies.

### Patch Changes

- Updated dependencies [656024a]
  - @gost-kit/eslint-config@0.1.0
