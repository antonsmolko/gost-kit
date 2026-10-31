import { createDispatch, type Store, type StoreConfig, type Trigger } from '@gost-kit/common';

export const createStore = <TState, TAction extends Trigger, TEffect extends Trigger>(
  {
    initState,
    reducer,
    effector,
    onError,
  }: StoreConfig<TState, TAction, TEffect>,
): Store<TState, TAction> => {
  // Reducers replace complete immutable state; deep proxies are unnecessary.
  let state = $state.raw(initState);

  const dispatch = createDispatch<TState, TAction, TEffect>({
    readState: () => state,
    writeState: (next) => {
      state = next;
    },
    reducer,
    effector,
    onError,
  });

  return {
    get state() { return state; },
    dispatch,
  };
};
