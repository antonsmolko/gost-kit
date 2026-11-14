---
'@gost-kit/common': minor
'@gost-kit/svelte': minor
'@gost-kit/eslint-plugin': patch
---

Replace object dispatch calls with `dispatch('namespace/ActionType', payload)`.
Action data moves to `action.payload`; payloads may have any declared type or be
absent. Root calls use `root/ActionType`. Use `forwardAction` to dispatch objects
returned by API callbacks or held by custom effect handlers.

Update the single-intent rule examples for the new dispatch syntax. Rule behavior
is unchanged.
