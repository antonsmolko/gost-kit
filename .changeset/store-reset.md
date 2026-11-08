---
'@gost-kit/common': minor
'@gost-kit/svelte': minor
---

Add synchronous store.reset({ excluded }) with fresh scope state factories.

Breaking change for the current 0.x API: StoreConfig.initState now requires a
zero-argument factory, and Store gained a required reset member. Existing
implementers of Store (test doubles, wrappers) must add reset; adapters can use
common's framework-independent createReset. Replace initState: initialState()
with initState: initialState.
Excluded root scopes retain current references; all other scopes use fresh defaults
in a single state update. Reset does not cancel running effects or suppress late responses.
