# @gost-kit/common

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
