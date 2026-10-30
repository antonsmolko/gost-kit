<script lang="ts">
  import { rootStore } from './store/root';

  const root = rootStore();
  const alert = $derived(root.state.alert);
</script>

{#if alert}
  <aside role="alert">
    <p>{alert.message}</p>
  </aside>
{/if}

<style>
  aside { margin: 20px 0; padding: 16px; border: 1px solid #bf3e3e; border-radius: 6px; background: #fff3f3; }
  p { margin-top: 0; }
</style>
