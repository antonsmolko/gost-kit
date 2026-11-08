---
'@gost-kit/common': minor
'@gost-kit/svelte': minor
---

Add synchronous store.reset({ excluded }) with fresh scope state factories.

Breaking change for the current 0.x API: StoreConfig.initState now requires a
zero-argument factory. Replace initState: initialState() with initState: initialState.
Store includes reset, backed by common's framework-independent createReset.
Excluded root scopes retain current references; all other scopes use fresh defaults
in a single state update. Reset does not cancel running effects or suppress late responses.
