import { createDispatch, type Store, type StoreConfig, type Trigger } from '@gost-kit/common';

export const createStore = <TState, TAction extends Trigger, TEffect extends Trigger>(
  config: StoreConfig<TState, TAction, TEffect>,
): Store<TState, TAction> => {
  // Reducers replace complete immutable state; deep proxies are unnecessary.
  let state = $state.raw(config.initState);

  const dispatch = createDispatch<TState, TAction, TEffect>({
    // Read the original config on each call, preserving handler replacements and this.
    reducer: (current, action) => config.reducer(current, action),
    effector: (effect, dispatch) => config.effector(effect, dispatch),
    readState: () => state,
    writeState: (next) => { state = next; },
    onError: config.onError,
  });

  return {
    get state() { return state; },
    dispatch,
  };
};
