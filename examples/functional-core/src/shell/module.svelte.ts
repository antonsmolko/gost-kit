import type { Dispatch, Effector, Reducer, Trigger } from './types.ts';

export const createModule = <S, A extends Trigger, E extends Trigger>(config: {
  initState: S;
  reducer: Reducer<S, A, E>;
  effector: Effector<A, E>;
}) => {
  // Reducers replace complete immutable state; deep proxies are unnecessary.
  let state = $state.raw(config.initState);

  const dispatch: Dispatch<A> = async (action) => {
    const commit = config.reducer(state, action);
    state = commit.state;
    await Promise.all(commit.effects.map((effect) => config.effector(effect, dispatch)));
  };

  return {
    get state() { return state; },
    dispatch,
  };
};
