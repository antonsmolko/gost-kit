# @gost-kit/svelte

## 0.2.0

### Minor Changes

- e89218e: Add synchronous store.reset({ excluded }) with fresh scope state factories.

  Breaking change for the current 0.x API: StoreConfig.initState now requires a
  zero-argument factory, and Store gained a required reset member. Existing
  implementers of Store (test doubles, wrappers) must add reset; adapters can use
  common's framework-independent createReset. Replace initState: initialState()
  with initState: initialState.
  Excluded root scopes retain current references; all other scopes use fresh defaults
  in a single state update. Reset does not cancel running effects or suppress late responses.

  Reset failures are reported through the store's onError as ResetError with
  kind: 'reset' and no action. StoreError now includes this variant; handlers
  reading action/effect must first narrow kind. Without a handler, report uses the
  existing console fallback. Errors during reset no longer propagate to its caller.

### Patch Changes

- Updated dependencies [3a39e51]
- Updated dependencies [e89218e]
  - @gost-kit/common@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [6723c38]
  - @gost-kit/common@0.2.0

## 0.1.0

### Minor Changes

- Initial public release of the Svelte 5 createStore binding for the GOST functional core.

### Patch Changes

- Updated dependencies
  - @gost-kit/common@0.1.0
