import type { EventObject, StoreAssigner, StoreContext } from '@xstate/store';

export type ApiError = { message: string };

export type ApiEffect<T, E extends EventObject> = {
  run: () => Promise<T>;
  onSuccess: (value: T) => E;
  onFailure: (error: ApiError) => E;
};

export type ActionResult<S, T, E extends EventObject> = {
  state: S;
  effect: ApiEffect<T, E>;
};

export const executeApiEffect = async <T, E extends EventObject>(
  effect: ApiEffect<T, E>,
  send: (event: E) => void,
): Promise<void> => {
  let value: T;
  try {
    value = await effect.run();
  } catch (error) {
    send(effect.onFailure({
      message: error instanceof Error ? error.message : 'Request failed',
    }));
    return;
  }

  // Mapping/dispatch errors are programming errors, not request failures.
  send(effect.onSuccess(value));
};

export const adaptAction = <S extends StoreContext, T, E extends EventObject>(
  action: (state: S) => ActionResult<S, T, E>,
): StoreAssigner<S, EventObject, never> => (state, _event, enqueue) => {
  const result = action(state);
  enqueue.effect(({ send }) => executeApiEffect(result.effect, send));
  return result.state;
};
