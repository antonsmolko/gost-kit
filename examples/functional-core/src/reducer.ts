import { define, reducing } from './shell/handlers.ts';
import type { GlobalAction, RootAction, RootEffect, RootState, UserAction } from './types.ts';

export const userReducer = define.reducer<RootState, UserAction, RootEffect>({
  UserSetEmailAction: ({ state, action }) => ({
    state: { ...state, user: { ...state.user, email: action.email } },
  }),
  UserLoadAction: ({ state }) => ({
    state: { ...state, user: { ...state.user, status: 'loading', errors: [] } },
    effects: {
      type: 'ApiEffect',
      url: '/user',
      body: { email: state.user.email },
      receiverSuccess: (response) => ({ type: 'UserSuccessReceiveAction', response }),
      receiverError: (errors) => ({ type: 'UserErrorReceiveAction', errors }),
    },
  }),
  UserSuccessReceiveAction: ({ state, action }) => ({
    state: { ...state, user: { ...state.user, status: 'ready', data: action.response, errors: [] } },
  }),
  UserErrorReceiveAction: ({ state, action }) => ({
    state: { ...state, user: { ...state.user, status: 'error', errors: action.errors } },
    effects: {
      type: 'DispatchActionEffect',
      action: {
        type: 'ShowAlertAction', status: 'error',
        message: action.errors.map((error) => error.message).join('; ') || 'Request failed',
      },
    },
  }),
});

const appReducer = define.reducer<RootState, GlobalAction, RootEffect>({
  ShowAlertAction: ({ state, action }) => ({
    state: { ...state, alert: { status: action.status, message: action.message } },
  }),
  DismissAlertAction: ({ state }) => ({ state: { ...state, alert: null } }),
});

export const reducer = reducing<RootState, RootAction, RootEffect>(userReducer, appReducer);
