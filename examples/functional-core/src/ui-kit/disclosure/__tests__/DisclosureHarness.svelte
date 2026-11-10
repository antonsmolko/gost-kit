<script lang="ts">
  import { guard, type Ulx } from '@gost-kit/common';
  import { Disclosure, type DisclosureHandle } from '..';
  import type { OpenChangeHandler } from '../types/open-change-handler';

  let first = $state<DisclosureHandle>();
  let controlled = $state<DisclosureHandle>();
  let showFirst = $state(true);
  let defaultOpen = $state(false);
  let open = $state(false);
  let accept = false;
  const events: string[] = [];

  const handleFirst = (value: boolean) => {
    events.push('first:' + String(value));
  };
  const initialCallback: OpenChangeHandler = (value) => {
    events.push('controlled:first:' + String(value));

    if (accept) {
      open = value;
    }
  };
  const nextCallback: OpenChangeHandler = (value) => {
    events.push('controlled:second:' + String(value));

    if (accept) {
      open = value;
    }
  };
  let onOpenChange = $state<OpenChangeHandler>(initialCallback);

  const resetHandle = (handle: Ulx<DisclosureHandle>) => {
    if (guard.ulx(handle)) {
      throw new Error('Fixture component must be mounted before reset');
    }

    return handle.reset();
  };

  export function resetFirst() {
    return resetHandle(first);
  }
  export function resetControlled() {
    return resetHandle(controlled);
  }
  export function setFirstVisible(value: boolean) {
    showFirst = value;
  }
  export function setDefault(value: boolean) {
    defaultOpen = value;
  }
  export function setOpen(value: boolean) {
    open = value;
  }
  export function setAcceptance(value: boolean) {
    accept = value;
  }
  export function replaceCallback() {
    onOpenChange = nextCallback;
  }
  export function readEvents() {
    return events.slice();
  }
</script>

{#if showFirst}
  <Disclosure
    label="Fixture first"
    {defaultOpen}
    onOpenChange={handleFirst}
    bind:this={first}
  >
    <input aria-label="First draft" />
  </Disclosure>
{/if}
<Disclosure label="Fixture second">
  <p>Second content</p>
</Disclosure>
<Disclosure
  label="Fixture controlled"
  {open}
  {onOpenChange}
  bind:this={controlled}
>
  <p>Controlled content</p>
</Disclosure>
