# Declarative effects with XState Store

An executable TypeScript example for [gost-kit#2](https://github.com/antonsmolko/gost-kit/issues/2),
supporting the functional-core investigation in [#1](https://github.com/antonsmolko/gost-kit/issues/1).
This is an illustrative private project, not a published library or a settled package API.

## Run

Use Node 26. From the repository root:

```sh
npm --prefix examples/xstate-api-effect ci
npm --prefix examples/xstate-api-effect run check
npm --prefix examples/xstate-api-effect start
npm --prefix examples/xstate-api-effect start -- --fail
```

The demos use synthetic data with no network requests. The first logs
`idle → loading → ready`; `--fail` logs `idle → loading → error`.
Node executes the TypeScript files directly; `check` runs strict TypeScript
checking and all seven behavior tests. No build step is needed.

## Flow

1. `createLoadAction(loadUser)` creates a pure `load(state)` action. The injected
   dependency is captured, not called. The action returns a new state and an
   effect description containing `run`, `onSuccess` and `onFailure`.
2. `adaptAction(load)` returns an XState Store transition handler. It returns
   `result.state` and schedules the description using `enqueue.effect`.
3. `executeApiEffect` calls `run`. It maps the resolved value to a `loaded` event,
   or a thrown/rejected request to a `failed` event, and sends it back to the store.
4. The `loaded` and `failed` transitions update the state synchronously. The
   application action contains no XState-specific effect scheduling or try/catch.

The wiring in `user-store.ts` is deliberately small:

```ts
const load = createLoadAction(loadUser);
// Inside createStore({ context, on: ... }):
load: adaptAction(load)
```

The sample's `User`, state and completion events belong to the feature.
`effect-adapter.ts` is the imperative shell. Tests inject controlled promises
instead of fetching or relying on timers. `store.transition` demonstrates that
calculating a transition alone neither executes the request nor commits state.
`store.trigger.load()` starts the operation; it does not return its completion
promise. Consumers observe completion through the store subscription.

## Scope and limits

- This adapter handles a state-only action with exactly one effect. Event payloads,
  multiple/optional effects, computed properties and Svelte bindings are outside
  this example.
- `run` must return a promise of trusted, already validated data. Synchronous throws
  and promise rejections are mapped to `{ message }`; unknown errors use
  `Request failed`. This is an example error shape, not an HTTP client contract
  or a True Myth Result integration.
- Completion mappers and transition handlers are synchronous and must not throw.
  Programming errors in mapping/dispatch are not reclassified as request failures;
  this example does not install a global error handler for such errors.
- Each `load` starts a request, clears the previous error and retains any previous
  user while loading. A failure also retains that user. Retry after failure is
  supported. There is no deduplication, cancellation, disposal policy or stale
  response protection: overlapping requests can overwrite each other in completion
  order. Use sequential requests when trying this example.
- TypeScript checks the declared effect event union, but this small generic adapter
  does not prove that every event is handled by the store and does no runtime
  validation. It is not intended as a general store framework.

## Upstream baseline

The maintained [XState Store example for effects](https://stately.ai/docs/xstate-store#effects)
provides synchronous transitions, effect scheduling and sending completion events.
Its [pure transitions API](https://stately.ai/docs/xstate-store#pure-transitions)
provides the test boundary. This example uses those supported APIs with
`@xstate/store` 4.3.0. The project-specific addition is a small adapter so that
application actions return an effect description instead of scheduling it directly.
