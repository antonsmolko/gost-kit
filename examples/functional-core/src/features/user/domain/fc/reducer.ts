import { define } from '@gost-kit/common';
import type { RootState } from '../../../../store/types/state';
import type { RootEffect } from '../../../../store/types/effect';
import type { UserAction } from './action';
import type { UserState } from './state';

export const userReducer = define.reducer<
  UserState,
  UserAction,
  RootEffect,
  RootState
>()({
  SetEmailAction: ({ state, action }) => {
    return {
      state: { ...state, email: action.email },
    };
  },
  LoadAction: ({ state }) => {
    return {
      state: {
        ...state,
        status: 'loading',
        errors: [],
      },
      effects: {
        type: 'ApiEffect',
        method: 'post',
        url: '/user',
        body: { email: state.email },
        defaultError: {
          code: 'USER_LOAD_FAILED',
          message: 'Could not load user',
          path: [],
        },
        onSuccess: (response) => {
          return { scope: 'users', type: 'SuccessReceiveAction', response };
        },
        onError: (errors) => {
          return { scope: 'users', type: 'ErrorReceiveAction', errors };
        },
      },
    };
  },
  SuccessReceiveAction: ({ state, action }) => {
    return {
      state: { ...state, status: 'ready', data: action.response, errors: [] },
    };
  },
  ErrorReceiveAction: ({ state, action }) => {
    return {
      state: { ...state, status: 'error', errors: action.errors },
      effects: {
        type: 'DispatchActionEffect',
        action: {
          type: 'ShowAlertAction',
          status: 'error',
          message:
            action.errors
              .map((error) => {
                return error.message;
              })
              .join('; ') || 'Request failed',
        },
      },
    };
  },
});
