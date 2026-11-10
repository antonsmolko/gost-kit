<script lang="ts">
  import { Disclosure, type DisclosureHandle } from './ui-kit/disclosure';
  import { rootStore } from './store/root';

  const root = rootStore();
  const detailsOpen = $derived(root.state.detailsOpen);
  let first = $state<DisclosureHandle>();

  const handleOpenChange = (open: boolean) => {
    return root.dispatch({ type: 'SetDetailsOpenAction', open });
  };
  const handleClose = () => {
    void root.dispatch({ type: 'SetDetailsOpenAction', open: false });
  };
  const handleResetFirst = async () => {
    await first?.reset();
  };
</script>

<section aria-label="Disclosure examples">
  <h2>Local UI state</h2>
  <Disclosure label="Local first" bind:this={first}>
    <p>First instance content</p>
  </Disclosure>
  <Disclosure label="Local second">
    <p>Second instance content</p>
  </Disclosure>
  <button type="button" onclick={handleResetFirst}>Reset local first</button>

  <Disclosure
    label="App-controlled details"
    open={detailsOpen}
    onOpenChange={handleOpenChange}
  >
    <p>The application owns this open value.</p>
  </Disclosure>
  <p>App-owned open: {detailsOpen}</p>
  <button type="button" onclick={handleClose}
    >Close app-controlled details</button
  >
</section>
