# GOST architecture rules

## gost/require-feature-state-selector

Select an immutable reactive branch before passing it to a computation in
`$derived` or the synchronous callback of `$derived.by`:

```ts
// Reported; a simple standalone declaration can be fixed with eslint --fix.
const view = $derived(userPresenter(root.state.user));

// Correct.
const user = $derived(root.state.user);
const view = $derived(userPresenter(user));
```

`root` is not a special name. The rule recognizes the declaration provenance of
`Store.state` from the public `@gost-kit/common` API, including aliases,
reexports, inferred `createStore` returns, nullable Store and supported mapped
or intersection types preserving that provenance. Declaration ownership is checked
against the actual common package, including nested installations where the
consumer cannot directly resolve common. It does not identify Store
solely by its name or structural assignability. Mixed unions and any/unknown
are not assumed to be Store.

A directly declared local `$state.raw` also represents a replaceable snapshot:

```ts
let model = $state.raw({ user: { name: 'Ada' } });
const user = $derived(model.user);
const view = $derived(userPresenter(user));
```

A plain `const snapshot = model` captures the current raw snapshot and is not
itself a reactive alias. Ordinary objects, deep-proxy `$state` and ordinary
functions named `$state`/`$derived` are not automatically subject to this rule.
TypeScript types alone cannot prove Svelte reactivity: both state runes return
`T`. `$state.raw` detection therefore inspects original variable bindings.

### Diagnostic scope

Direct reads used in call arguments or receivers, constructor arguments and
tagged template substitutions inside reactive expressions are reported, including multiple branches, method chains, static bracket keys,
optional calls/access, and passing an entire `Store.state` snapshot.
Selectors without a computation call remain valid, including `$derived.by`
selectors. Event handlers and other nonreactive reads are outside the rule.
Callbacks passed as values are not assumed to run synchronously; the explicit
`$derived.by` callback is inspected when it is neither async nor a generator.
Instance field initializers are deferred; static fields and computed keys are
evaluated with the class expression and remain in scope. Helpers, arbitrary returned reactive values,
aliased snapshots, dynamic state keys and dependencies hidden across modules
are not traced. No claim of complete interprocedural analysis or presenter
purity is made.

### Autofix

Autofix handles a standalone top-level derived declaration in a rune module or
component instance script, with a single direct function call and one immediate
feature-field argument. A selector is inserted immediately before the declaration.
The final field supplies the name; occupied names use `V2`, `V3`, etc. Imports,
later declarations and references visible from outer scopes are considered.
Repeated fixing does not add selectors. Field names beginning with `$` receive
no fix: Svelte reserves dollar-prefixed bindings, including suffixed names.

Constructors and tagged templates have diagnostics only.
Complex `$derived.by`, nested declarations, multiple inputs/declarators,
receivers, optional/dynamic access, deeper property/getter paths, conditional
arguments, spreads and exported declarations retain diagnostics without fixes.
Fixes preserve surrounding comments and line endings; Prettier can then normalize
layout. The normal derived contract still requires pure computations.

Separate selection lets Svelte skip downstream updates when the feature's value
is referentially unchanged. It does not make a mutable feature immutable or
prevent recomputation when the selected feature actually changes.

Sources: [Svelte update propagation](https://svelte.dev/docs/svelte/$derived#Update-propagation),
[Svelte state](https://svelte.dev/docs/svelte/$state),
[typed ESLint rules](https://typescript-eslint.io/developers/custom-rules/).

## gost/no-component-state

Opt in for application components whose logical state belongs in root/feature
state. The shared Svelte config registers this rule but leaves it off:

```ts
export default [
  ...(await createSvelteConfig({ tsconfigRootDir: import.meta.dirname })),
  {
    files: ['src/**/*.svelte'],
    rules: { 'gost/no-component-state': 'error' },
  },
  {
    files: ['src/ui-kit/**/*.svelte'],
    rules: { 'gost/no-component-state': 'off' },
  },
];
```

The UI-Kit path is illustrative: the consumer selects its own boundaries.
Independent UI components may own local state. Disabling this rule preserves
all other shared Svelte and TypeScript checks. No architecture flag, runtime
Store dependency or type-aware parser services are required by this rule.

Within selected files, direct intrinsic `$state(...)`, `$state.raw(...)` and
`$bindable(...)` calls report `componentState`, including module scripts,
nested helpers and class fields. Lexically shadowed ordinary functions are
ignored. Use state selectors, read-only `$derived`, pure presenter calls and
intent actions for application logic. `$props`, ordinary variables and temporary
browser handles are permitted.

A simple DOM/component ref is allowed when a rune initializes a direct identifier
in the instance script with no argument, `null` or unshadowed `undefined`, and
that same variable binding appears directly in `bind:this`:

```svelte
<script lang="ts">
  let input = $state<HTMLInputElement>();
</script>

<input bind:this={input} />
<button type="button" onclick={() => input?.focus()}>Focus</button>
```

An unused empty rune, nonempty initializer, module-script binding or same name
in a different scope does not qualify. `bind:value` is not a ref exception.
The exception identifies ref initialization; it does not verify every subsequent
write to the ref.

There is no autofix: state ownership, actions and lifecycle require design.
This first rule checks the listed rune creations, not all mutations or state
hidden behind imports/helpers. Props/derived values still require read-only
usage in review. Dispatch composition (#17), boolean template conditions (#18)
and presenter computations (#19) are separate checks. `.svelte.ts` shell modules
remain available outside the component-only override.

The shared config registers `gost` for `.svelte` and `.svelte.ts`, not `.svelte.js`.
If deliberately extending this policy to `.svelte.js`, install `@gost-kit/eslint-plugin`
explicitly in the consumer and register the plugin
in that override (`plugins: { gost: plugin }`, with the named `plugin` import from
`@gost-kit/eslint-plugin`). Enabling the rule alone for that extension fails plugin
lookup. The default typed selector rule remains excluded from `.svelte.js`.

## gost/single-intent-dispatch

Business UI callbacks forward one intent action. The reducer chooses business
transitions/effects from current state. UI-Kit owns local state, browser events
and their conditional processing. When a business feature needs such a mechanism,
extract a library component and consume ready values/semantic callbacks.

The shared config registers this typed rule but leaves it off. Enable it for
business component files and exclude UI-Kit with ordinary late overrides:

```ts
export default [
  ...(await createSvelteConfig({ tsconfigRootDir: import.meta.dirname })),
  {
    files: ['src/**/*.svelte'],
    rules: { 'gost/single-intent-dispatch': 'error' },
  },
  {
    files: ['src/ui-kit/**/*.svelte'],
    rules: { 'gost/single-intent-dispatch': 'off' },
  },
];
```

Paths are illustrative. Other Svelte/TypeScript rules keep their configured
levels. Type services are required for TypeScript instance scripts; a missing
project is a configuration error. JS/stateless/module-only scripts and ordinary
TS/rune modules are skipped before requesting services.

Handlers are found through `on*` props/attributes (including `onConfirm` and `{onConfirm}` shorthand) and
legacy `on:` directives, rather than function names. This is a lexical prefix
heuristic, not event-prop type discovery: a function-valued prop named `once` or
`only` is also treated as a handler. Such non-event props can produce false
positives; use an appropriate consumer scope or a targeted ESLint exception.
Lowercase custom callbacks such as `onemailchange` remain supported. Inline functions, local
function declarations, const function expressions and simple const aliases are
supported, including transparent TypeScript `satisfies`/`as` wrappers. Handlers
declared in template `{@const}` tags are outside this first version's discovery. Reassigned callbacks, arbitrary member methods/imported functions,
spread props and callback names without the `on` prefix are not traced.
Forwarding `onconfirm={presenter.confirm}` is permitted without claiming to
verify the method body or presenter purity.

A dispatch is recognized by declaration provenance of the public
`@gost-kit/common` `Dispatch` type and its call signature, including simple type
aliases/reexports, const/destructured aliases, `Store.dispatch` and inferred
`createStore` returns. Signature ownership matters: TypeScript may reuse alias
metadata for structurally equal local callbacks. Name/shape alone, plain
`AsyncTap`, any/unknown and mixed unions do not prove Dispatch; genuine nullable
Dispatch is supported. Optional invocation/access that can suppress that
Dispatch (`send?.(action)`, `store?.dispatch(action)` or `store.dispatch?.(action)`)
is conditional intent delivery and reports `conditionalDispatch` for a single call.
This includes a Dispatch evaluated in skipped arguments/computed keys of an
outer optional expression, such as `consume?.(dispatch(action))` or
`values?.[String(dispatch(action))]`.
Ordinary optional data reads and optional accesses after the Dispatch result are
not treated as a dispatch gate. Parenthesized chains that end before an
unconditional call follow JavaScript chain boundaries, not optional-call semantics.
No application runtime packages are installed by tooling.

The handler's own body and parameter defaults report:

- `multipleDispatch`: two or more direct Dispatch calls, even in mutually
  exclusive branches. Send one intent and move selection to the reducer.
- `conditionalDispatch`: one Dispatch plus `if`, `switch`, loops, a conditional
  or logical expression/assignment (`??=`, `&&=`, `||=`), including early guards and an action's
  conditional `type`. Browser-event guards have no special exception.

This is a syntactic whole-handler policy, not control-flow dependence analysis:
a listed condition anywhere in the handler's own evaluation is reported when
that handler contains a Dispatch, including a condition after an unconditional
Dispatch and a condition unrelated to choosing its action. The diagnostic directs
conditional logic to the reducer/UI-Kit; it does not prove that a particular
condition selected the dispatched action.

Dispatch in a parameter default is conditional on the argument being absent;
it is counted and diagnosed accordingly. Ordinary ready-value defaults are
permitted. Nested callback defaults are deferred like other nested functions.

Multiple-call diagnostics take priority; one handler produces one report even
if bound to several events. Direct/void/await calls with a ready action/value
are permitted. Nested function bodies and nonstatic instance initializers are
not part of the enclosing handler's evaluation. Static initialization/computed
keys remain included. Helper/constructor call graphs are not followed.

```ts
// Reported: business choice remains in the component.
const handleSubmit = () => {
  if (hasUser) {
    void dispatch({ type: 'UpdateUserAction' });
  } else {
    void dispatch({ type: 'CreateUserAction' });
  }
};

// Use an intent callback supplied to a UI-Kit component.
const handleSubmit = () => {
  void dispatch({ type: 'SubmitUserAction' });
};
```

There is no autofix: action/reducer/UI component contracts require design.
This rule does not prove absence of all browser APIs, hidden dispatches or
business logic. A lone `preventDefault()` without a branch is not automatically
a dispatch diagnostic, although it violates the business-component boundary.
Event adaptation belongs in UI-Kit. Effects outside discovered UI callbacks may
perform several dispatches. Presentation computations (including templates) are
#19, boolean template conditions #18, and testable local UI-state #27.

## gost/ready-boolean-condition

Opt in for business `.svelte` files. `{#if}` and `{:else if}` read a ready
boolean; ordinary else and conditional rendering remain available.

```svelte
{#if view.isLoaded}
  <p>{view.name}</p>
{:else if isFailed}
  <p>Failed</p>
{/if}
```

Allowed: boolean literals true/false, identifiers and static field chains rooted
at an identifier (for example view.ready), including quoted keys and number-valued
AST literal indexes such as flags[0] or flags[0x10]. The final type must be
definitely boolean. this.isReady is outside the supported root form. Signed keys
such as flags[-1] are unary expressions, and bigint keys such as flags[10n] are
not number-valued literals; both are outside this first-version syntax boundary.
Optional chains are accepted only when the complete expression excludes
undefined/null. Boolean aliases, boolean-only unions and proven boolean generic
constraints are accepted. TypeScript flow narrowing applies at the expression.

Reported with `readyBoolean`: comparisons, logical operations, negation, calls,
ternaries, dynamic keys, assertions/non-null assertions/satisfies wrappers,
object/string/number truthiness, nullable booleans and any/unknown/never. Move
the calculation to a pure presenter and read its named boolean result. There
is no autofix or suggestion that invents a presenter/field name.

Identifier/member reads require actual parser type services and strictNullChecks,
either directly or via strict. Explicit strictNullChecks: false overrides strict.
Missing services/null checking is a configuration error, not a successful check.
Literal booleans and invalid syntax do not need services; components without
conditions do not request them. Type services also cover JS-script and stateless
components when the configured parser supplies a program. Inferred any in JS
props is rejected just like TypeScript any. Script if statements, ordinary TS and
rune modules are outside the rule.

This checks shape and type, not provenance/purity. A local boolean or boolean
getter is not proof of a presenter. Rule #19 addresses presentation calculations
outside template conditions. Static indexed reads follow consumer TypeScript
options; enable noUncheckedIndexedAccess to expose possible missing entries.
The rule does not validate runtime input that the declared types conceal.

`createSvelteConfig` registers it explicitly off. Enable with a later override:

```ts
{
  files: ['src/**/*.svelte'],
  rules: { 'gost/ready-boolean-condition': 'error' },
}
```

Independent UI-Kit components may use a later matching off override while
retaining the other TypeScript/Svelte checks.

The current svelte-eslint-parser 1.10.1 models component generics as aliases to
their constraints (unknown when unconstrained). Conditional types over those
component generics may therefore resolve differently from a particular caller's
instantiation. This rule checks the parser-provided program, not every generic
instantiation; use an explicitly boolean view field for that boundary. It cannot
recover source type distinctions already erased by the parser.
