# Local UI-component state

The Disclosure example reuses `@gost-kit/common` reducers/effects and
`@gost-kit/svelte` reactivity. It is an example UI-Kit component, not a published
widget or a new store API.

Run the application as described in the [example README](../README.md).
The “Local UI state” section shows two independent local instances and a third
instance whose value belongs to the application.

## Local ownership

Use defaultOpen to seed one instance. Omitting it starts closed:

```svelte
<script lang="ts">
  import { Disclosure } from './ui-kit/disclosure';
</script>

<Disclosure label="More information" defaultOpen={false}>
  <p>This content stays mounted while hidden.</p>
</Disclosure>
```

Every instance creates its own store. defaultOpen is read once at construction;
later changes do not replace current state or the reset baseline.
An optional onOpenChange callback receives actual local transitions.
Setting the same value does not notify.

## Application ownership

Pass open and onOpenChange together. In this example's application:

```svelte
<script lang="ts">
  import { Disclosure } from './ui-kit/disclosure';
  import { rootStore } from './store/root';

  const root = rootStore();
  const open = $derived(root.state.detailsOpen);

  const handleOpenChange = (open: boolean) => {
    return root.dispatch({ type: 'SetDetailsOpenAction', open });
  };
</script>

<Disclosure
  label="App-controlled details"
  {open}
  onOpenChange={handleOpenChange}
>
  <p>The application decides whether to accept the requested value.</p>
</Disclosure>
```

There is no mutable open copy inside the controlled component. Each intent reads
the current prop and proposes its next value. The consumer may accept, delay,
change or ignore that proposal. Until a new prop arrives, the old value stays
visible. Two toggles while the owner still supplies false therefore request
true twice. External prop updates never notify.

Callbacks are read when the effect runs; replacing a callback prop does not
recreate the model or retain the old function. A callback may return void or
Promise<void>. Dispatch waits for that Promise. Completion does not write an
optimistic value into the controlled model.

Choose ownership when creating the component. Changing open between undefined
and boolean is an ownership error; remount to change modes. Do not supply
defaultOpen in controlled mode. This API does not use bind:open/$bindable.

## Reset through bind:this

The component exports reset(): Promise<void>. Obtain the handle with bind:this
and invoke it after mount, for example from an event callback:

```svelte
<script lang="ts">
  import { Disclosure, type DisclosureHandle } from './ui-kit/disclosure';

  let disclosure = $state<DisclosureHandle>();

  const handleReset = async () => {
    await disclosure?.reset();
  };
</script>

<Disclosure
  label="Resettable details"
  defaultOpen={true}
  bind:this={disclosure}
>
  <p>Reset restores this instance's original open value.</p>
</Disclosure>
<button type="button" onclick={handleReset}>Reset details</button>
```

reset sends SetOpenAction with the value captured at creation. It intentionally
does not call Store.reset, which would skip the notification effect.
For a local instance the baseline is its initial defaultOpen (false if absent).
For a controlled instance it is the initial open prop: reset requests that value,
and the owner still decides whether to publish it. A no-op reset does not notify.
Resetting one instance does not change another.

## State, effects and errors

The [pure reducer](../src/ui-kit/disclosure/domain/fc/reducer.ts) returns the next
DisclosureState and an OpenChangeEffect containing the boolean to notify.
Effects carry their own values, so rapid local toggles notify true and false in
order without reading a newer state after await.

The [model](../src/ui-kit/disclosure/model/create-disclosure-model.ts) uses
createStore for local state and createDispatch with external reads/no-op writes
for controlled state. The shared define.effector/effecting handler invokes the
callback. A [pure presenter](../src/ui-kit/disclosure/ui/disclosure.presenter.ts)
prepares ready aria/hidden flags.

Invalid ownership throws TypeError at construction or a direct state read.
During dispatch/reset it is reported once as a readState failure; no transition
or notification occurs, and the dispatch Promise resolves. The local adapter
checks only that open stays undefined; it does not reread/revalidate defaultOpen.
Controlled reads check the current open/callback/defaultOpen combination.

Callback exceptions/rejections are effect failures handled by the existing common
reporter. Local state is already committed and is not rolled back. These callbacks
are not a replacement for application API error actions.

## DOM and lifecycle

Native buttons provide Enter/Space behavior. Each panel has its own stable id
linked with aria-controls and a ready aria-expanded value. hidden changes
visibility without unmounting children or losing their DOM state.

The model creates no timers, subscriptions or observers. There is no synthetic
dispose API. Unmounting removes Svelte bindings; remounting creates a fresh model.
Already-running external async callbacks are not cancelled.

The example's UI-Kit lint override marks ownership boundaries: four business
component policies are off for src/ui-kit/**/*.svelte. Ordinary Svelte/TypeScript
checks and the typed selector rule stay enabled. The application component still
uses ready values and one named root dispatch callback. UI-Kit code never imports
the application's root state or action types.

Pure reducer/presenter and model tests are colocated. Real component isolation,
reset, remount, controlled behavior and keyboard/child-state checks run in
[Playwright](../e2e/disclosure.spec.ts).
