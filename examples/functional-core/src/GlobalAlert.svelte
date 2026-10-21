<script lang="ts">
  import { useDispatch, useRootStore } from './root.ts';

  const root = useRootStore();
  const dispatch = useDispatch();
  const alert = $derived(root.state.alert);
</script>

{#if alert}
  <aside role="alert">
    <p>{alert.message}</p>
    <button type="button" onclick={() => dispatch({ type: 'DismissAlertAction' })}>
      Dismiss notification
    </button>
  </aside>
{/if}

<style>
  aside { margin: 20px 0; padding: 16px; border: 1px solid #bf3e3e; border-radius: 6px; background: #fff3f3; }
  p { margin-top: 0; }
</style>
