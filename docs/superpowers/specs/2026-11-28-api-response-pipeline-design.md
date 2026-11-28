# API response validation and mapping

Issue [gost-kit #57](https://github.com/antonsmolko/gost-kit/issues/57).

## API

An operation can declare a validator and a mapper separately:

```ts
const checkSession = defineApiOperation<Paths>()({
  method: 'get',
  url: '/auth/me',
  response: response
    .validate(checkSessionResponseValidator)
    .map(checkSessionResponseMapper),
});
```

The validator receives `unknown` and returns `AppError[]` synchronously. A
mapper receives the original DTO. The method and URL determine its input
type through OpenAPI. The awaited mapper return type determines the
`onSuccess` argument. The builder describes the pipeline. The effector
executes it.

The existing `mapResponse` option remains available. Each operation
chooses either the pipeline or `mapResponse`. With neither, the operation
maps the DTO to itself as before.

## Why this shape

A flat `validateResponse` option alongside `mapResponse` would require
fewer new public types. The fluent form in the issue expresses their order
at the call site and lets the application keep its existing named validator
and mapper. It produces a plain descriptor so defining an operation does
not run validation or mapping.

A TypeScript 5.9.3 probe with the package's `ApiResponse` type confirmed
that an inline validator sees `unknown`, an inline mapper sees the route's
DTO, and an async mapper preserves its awaited output type. A mapper for a
different route and an operation with both forms were rejected.

## Execution

1. A failed client request returns to the effect error path with its original
   HTTP or transport failure.
2. After a successful request, the effector calls the validator once, when
   configured. An empty list lets the original DTO reach the mapper.
3. A nonempty list produces `{ kind: 'contract', errors }` with all returned
   errors and their original paths and order. The mapper and `onSuccess`
   are skipped. The effector sends the existing `onError(errors, failure)`
   callback the returned list. Omitting the callback keeps the store
   reporter path.
4. An exception from either stage follows the existing mapper exception
   policy and becomes a contract failure with an empty error list.
   The effect applies its existing `defaultError` fallback.

The operation factory can store the validator alongside the existing
normalized `mapResponse` callback. The public HTTP client still returns
the route DTO. Its `onFailure` observes errors of the request itself. The
effector handles operation validation after that boundary.

## Checks

Cover validator input typing, route and mapper compatibility, inline
inference, the mapped `onSuccess` type, and the exclusive operation options.
Exercise success and original DTO identity, multiple validation errors, a
throw in either stage, client failures bypassing both stages, and the effect
error path with and without a callback. Keep existing `mapResponse` and
direct request checks. Compile the public README example and run the full
workspace check. Add a minor changeset for `@gost-kit/common`.
