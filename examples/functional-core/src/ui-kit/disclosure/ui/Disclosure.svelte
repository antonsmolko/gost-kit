<script lang="ts">
  import { createDisclosureModel } from '../model/create-disclosure-model';
  import { disclosurePresenter } from './disclosure.presenter';
  import type { DisclosureProps } from '../types/disclosure-props';

  const props: DisclosureProps = $props();
  const id = $props.id();
  const panelId = id + '-panel';
  const model = createDisclosureModel(() => {
    return props;
  });
  const state = $derived(model.state);
  const view = $derived(disclosurePresenter({ state }));

  const handleToggle = () => {
    void model.dispatch({ type: 'ToggleAction' });
  };

  export function reset() {
    return model.reset();
  }
</script>

<div class="disclosure">
  <button
    type="button"
    aria-expanded={view.isOpen}
    aria-controls={panelId}
    onclick={handleToggle}
  >
    {props.label}
  </button>
  <div id={panelId} hidden={view.isHidden}>
    {@render props.children?.()}
  </div>
</div>

<style>
  .disclosure {
    margin-block: 12px;
  }
</style>
