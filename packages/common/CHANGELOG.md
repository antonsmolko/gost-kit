# @gost-kit/common

## 0.3.1

### Patch Changes

- 12b4d28: Rewrite package descriptions and README quick starts with installation requirements, complete examples and consumer-facing reference. Replace links that cannot resolve from npm package archives.

## 0.3.0

### Minor Changes

- 3a39e51: Add defineApiOperation and createApiEffect for reusable schema-typed API operations
  with DTO-to-domain mapping. The shared handler dispatches mapped results and
  routes mapper failures through onError.

  Breaking API changes: remove the raw ApiEffect<Paths, Action> format and the
  unused ApiRequest<Paths> type. To migrate, describe method/url/mapResponse with
  defineApiOperation<Paths>() and construct effects using
  createApiEffect(operation, options). Declare the effect type as
  ApiEffect<Operation, SuccessAction, ErrorAction>; type success/error actions
  separately. An omitted mapResponse uses identity. Direct api.request calls keep
  their method/path/options signature and schema-derived DTO result.

  Rename the effect table factory from createApiHandler to
  createApiEffector. Pass its returned table to effecting to build the
  executable effector.

  Export SingleApiOperation for typed wrappers that require one narrowed operation.

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

## 0.2.1

### Patch Changes

- 6c74d68: Expose a composed TypeScript policy for framework adapters without an ESLint
  reflection instance. Cover JSX/TSX with general checks and remove unused direct
  config dependencies. Reject ambiguous combined Content-Type values while
  preserving commas inside quoted parameters.

## 0.2.0

### Minor Changes

- 6723c38: Add a framework-independent OpenAPI client with centralized result/error handling
  and a reusable ApiEffect handler with typed request callbacks and awaited dispatch.

## 0.1.0

### Minor Changes

- Initial public release of shared TypeScript types, runtime guards, functional core composition and dispatch, application error helpers, and logging utilities.
