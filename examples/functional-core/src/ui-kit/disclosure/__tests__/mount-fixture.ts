import { guard, type Ulx } from '@gost-kit/common';
import { mount, tick, unmount } from 'svelte';
import DisclosureHarness from './DisclosureHarness.svelte';

export type FixtureCommand =
  | { type: 'resetFirst' }
  | { type: 'resetControlled' }
  | { type: 'showFirst'; value: boolean }
  | { type: 'setDefault'; value: boolean }
  | { type: 'setOpen'; value: boolean }
  | { type: 'accept'; value: boolean }
  | { type: 'replaceCallback' }
  | { type: 'events' };

const createFixture = () => {
  const target = document.createElement('div');

  target.dataset.disclosureFixture = 'true';
  document.body.append(target);

  return { component: mount(DisclosureHarness, { target }), target };
};
let fixture: Ulx<ReturnType<typeof createFixture>>;

export const setup = async () => {
  fixture = createFixture();
  await tick();
};

export const cleanup = async () => {
  if (!guard.ulx(fixture)) {
    await unmount(fixture.component);
    fixture.target.remove();
    fixture = undefined;
  }
};

export const command = async (action: FixtureCommand) => {
  if (guard.ulx(fixture)) {
    throw new Error('Fixture has not been mounted');
  }

  const component = fixture.component;

  switch (action.type) {
    case 'resetFirst':
      await component.resetFirst();
      break;
    case 'resetControlled':
      await component.resetControlled();
      break;
    case 'showFirst':
      component.setFirstVisible(action.value);
      break;
    case 'setDefault':
      component.setDefault(action.value);
      break;
    case 'setOpen':
      component.setOpen(action.value);
      break;
    case 'accept':
      component.setAcceptance(action.value);
      break;
    case 'replaceCallback':
      component.replaceCallback();
      break;
    case 'events':
      break;
  }

  await tick();

  return component.readEvents();
};
