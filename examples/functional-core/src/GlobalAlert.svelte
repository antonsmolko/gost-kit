<script lang="ts">
  import { rootStore } from './store/root';
  import { globalAlertPresenter } from './global-alert.presenter';

  const root = rootStore();
  const alert = $derived(root.state.alert);
  const view = $derived(globalAlertPresenter({ alert }));
</script>

{#if view.isVisible}
  <aside role="alert">
    <p>{view.message}</p>
  </aside>
{/if}

<style>
  aside {
    margin: 20px 0;
    padding: 16px;
    border: 1px solid #bf3e3e;
    border-radius: 6px;
    background: #fff3f3;
  }
  p {
    margin-top: 0;
  }
</style>
