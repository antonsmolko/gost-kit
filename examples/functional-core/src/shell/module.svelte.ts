import type { Dispatch, Effector, ModuleError, Reducer, Trigger } from './types.ts';

export const createModule = <S, A extends Trigger, E extends Trigger>(config: {
  initState: S;
  reducer: Reducer<S, A, E>;
  effector: Effector<A, E>;
  onError?: (failure: ModuleError<A, E>) => void | Promise<void>;
}) => {
  // Reducers replace complete immutable state; deep proxies are unnecessary.
  let state = $state.raw(config.initState);
  const onError = config.onError ?? ((failure: ModuleError<A, E>) => console.error(failure));
  const report = async (failure: ModuleError<A, E>) => {
    try {
      await onError(failure);
    } catch (error) {
      try {
        console.error('Module error handler failed', { failure, error });
      } catch {
        // A broken logging sink must not reject dispatch either.
      }
    }
  };

  const dispatch: Dispatch<A> = async (action) => {
    try {
      const commit = config.reducer(state, action);
      state = commit.state;
      const results = await Promise.allSettled(
        commit.effects.map(async (effect) => config.effector(effect, dispatch)),
      );
      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          await report({ kind: 'effect', action, effect: commit.effects[index], error: result.reason });
        }
      }
    } catch (error) {
      await report({ kind: 'reducer', action, error });
    }
  };

  return {
    get state() { return state; },
    dispatch,
  };
};
