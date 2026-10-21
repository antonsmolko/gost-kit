import type { Commit, Reducer } from './shell/types.ts';
import type { RootAction, RootEffect, RootState, UserAction } from './types.ts';

export const initialState = (): RootState => ({
  user: { email: '', status: 'idle', data: null, errors: [] },
  alert: null,
});

// Feature-owned transitions return a complete state and descriptions of work.
const userReducer = (state: RootState, action: UserAction): Commit<RootState, RootEffect> => {
  switch (action.type) {
    case 'UserSetEmailAction':
      return {
        state: { ...state, user: { ...state.user, email: action.email } },
        effects: [],
      };
    case 'UserLoadAction':
      return {
        state: { ...state, user: { ...state.user, status: 'loading', errors: [] } },
        effects: [{
          type: 'ApiEffect',
          url: '/user',
          body: { email: state.user.email },
          receiverSuccess: (response) => ({ type: 'UserSuccessReceiveAction', response }),
          receiverError: (errors) => ({ type: 'UserErrorReceiveAction', errors }),
        }],
      };
    case 'UserSuccessReceiveAction':
      return {
        state: { ...state, user: { ...state.user, status: 'ready', data: action.response, errors: [] } },
        effects: [],
      };
    case 'UserErrorReceiveAction':
      return {
        state: { ...state, user: { ...state.user, status: 'error', errors: action.errors } },
        effects: [{
          type: 'DispatchActionEffect',
          action: {
            type: 'ShowAlertAction', status: 'error',
            message: action.errors.map((error) => error.message).join('; ') || 'Request failed',
          },
        }],
      };
  }
};

export const reducer: Reducer<RootState, RootAction, RootEffect> = (state, action) => {
  switch (action.type) {
    case 'ShowAlertAction':
      return { state: { ...state, alert: { status: action.status, message: action.message } }, effects: [] };
    case 'DismissAlertAction':
      return { state: { ...state, alert: null }, effects: [] };
    default:
      return userReducer(state, action);
  }
};
