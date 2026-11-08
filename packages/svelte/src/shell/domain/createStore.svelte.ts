import {
  createDispatch,
  createReset,
  type Store,
  type StoreConfig,
  type Trigger,
} from '@gost-kit/common';

export const createStore = <
  TState,
  TAction extends Trigger,
  TEffect extends Trigger,
>({
  initState,
  reducer,
  effector,
  onError,
}: StoreConfig<TState, TAction, TEffect>): Store<TState, TAction> => {
  // Reducers replace complete immutable state; deep proxies are unnecessary.
  let state = $state.raw(initState());

  const readState = () => {
    return state;
  };
  const writeState = (next: TState) => {
    state = next;
  };

  const dispatch = createDispatch<TState, TAction, TEffect>({
    readState,
    writeState,
    reducer,
    effector,
    onError,
  });
  const reset = createReset({ initState, readState, writeState, onError });

  return {
    get state() {
      return state;
    },
    dispatch,
    reset,
  };
};
