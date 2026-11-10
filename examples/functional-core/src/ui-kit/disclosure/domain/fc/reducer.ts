import { define, reducing, type Commit, type Reducer } from '@gost-kit/common';
import type { DisclosureState } from './state';
import type { DisclosureAction } from './action';
import type { DisclosureEffect } from './effect';

const setOpen = (
  state: DisclosureState,
  open: boolean,
): Commit<DisclosureState, DisclosureEffect> => {
  if (state.open === open) {
    return { state, effects: [] };
  }

  return { state: { open }, effects: [{ type: 'OpenChangeEffect', open }] };
};

const handlers = define.reducer<
  DisclosureState,
  DisclosureAction,
  DisclosureEffect
>()({
  ToggleAction: ({ state }) => {
    return setOpen(state, !state.open);
  },
  SetOpenAction: ({ state, action }) => {
    return setOpen(state, action.open);
  },
});

export const disclosureReducer: Reducer<
  DisclosureState,
  DisclosureAction,
  DisclosureEffect
> = reducing({ root: handlers });
