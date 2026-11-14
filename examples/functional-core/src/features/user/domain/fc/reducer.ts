import { createApiEffect, define } from '@gost-kit/common';
import type { RootState } from '../../../../store/types/state';
import type { RootEffect } from '../../../../store/types/effect';
import type { UserAction } from './action';
import type { UserState } from './state';
import { loadUser } from '../../data/api/load-user';

export const userReducer = define.reducer<
  UserState,
  UserAction,
  RootEffect,
  RootState
>()({
  SetEmailAction: ({ state, action }) => {
    return {
      state: { ...state, email: action.payload.email },
    };
  },
  LoadAction: ({ state }) => {
    return {
      state: {
        ...state,
        status: 'loading',
        errors: [],
      },
      effects: [
        createApiEffect(loadUser, {
          body: { email: state.email },
          defaultError: {
            code: 'USER_LOAD_FAILED',
            message: 'Could not load user',
            path: [],
          },
          onSuccess: (response) => {
            return {
              scope: 'users',
              type: 'SuccessReceiveAction',
              payload: { response },
            };
          },
          onError: (errors) => {
            return {
              scope: 'users',
              type: 'ErrorReceiveAction',
              payload: { errors },
            };
          },
        }),
      ],
    };
  },
  SuccessReceiveAction: ({ state, action }) => {
    return {
      state: {
        ...state,
        status: 'ready',
        data: action.payload.response,
        errors: [],
      },
    };
  },
  ErrorReceiveAction: ({ state, action }) => {
    return {
      state: { ...state, status: 'error', errors: action.payload.errors },
      effects: {
        type: 'DispatchActionEffect',
        action: {
          type: 'ShowAlertAction',
          payload: {
            status: 'error',
            message:
              action.payload.errors
                .map((error) => {
                  return error.message;
                })
                .join('; ') || 'Request failed',
          },
        },
      },
    };
  },
});
