import { createStore } from '@xstate/store';
import { adaptAction } from './effect-adapter.ts';
import type { ActionResult, ApiError } from './effect-adapter.ts';

export type User = { id: string; name: string };
export type State = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  user: User | null;
  error: string | null;
};
type UserEvent =
  | { type: 'loaded'; user: User }
  | { type: 'failed'; error: ApiError };

// Describes work; calling this action never executes loadUser.
export const createLoadAction = (loadUser: () => Promise<User>) =>
  (state: State): ActionResult<State, User, UserEvent> => ({
    state: { ...state, status: 'loading', error: null },
    effect: {
      run: loadUser,
      onSuccess: (user) => ({ type: 'loaded', user }),
      onFailure: (error) => ({ type: 'failed', error }),
    },
  });

export const createUserStore = (loadUser: () => Promise<User>) => {
  const initialState: State = { status: 'idle', user: null, error: null };
  const load = createLoadAction(loadUser);

  return createStore({
    context: initialState,
    on: {
      load: adaptAction(load),
      loaded: (state, event: { user: User }): State => ({
        ...state, status: 'ready', user: event.user, error: null,
      }),
      failed: (state, event: { error: ApiError }): State => ({
        ...state, status: 'error', error: event.error.message,
      }),
    },
  });
};
