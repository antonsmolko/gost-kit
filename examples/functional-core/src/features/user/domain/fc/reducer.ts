import { define } from '@gost/common';
import type { RootState } from '../../../../store/types/state';
import type { RootEffect } from '../../../../store/types/effect';
import type { UserAction } from './action';

export const userReducer = define.reducer<RootState, UserAction, RootEffect>({
  UserSetEmailAction: ({ state, action }) => ({
    state: { ...state, user: { ...state.user, email: action.email } },
  }),
  UserLoadAction: ({ state }) => ({
    state: {
      ...state,
      user: {
        ...state.user,
        status: 'loading',
        errors: [],
      },
    },
    effects: {
      type: 'ApiEffect',
      url: '/user',
      body: { email: state.user.email },
      defaultError: { code: 'USER_LOAD_FAILED', message: 'Could not load user', path: [] },
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
