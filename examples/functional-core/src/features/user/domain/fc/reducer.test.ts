import { expect, test } from 'vitest';
import { reducing, type Reducer } from '@gost/common';
import { userReducer } from './reducer.ts';
import { initialState } from '../../../../store/fc/state.ts';
import type { RootState } from '../../../../store/types/state.ts';
import type { RootEffect } from '../../../../store/types/effect.ts';
import type { UserAction } from './action.ts';
import type { User } from '../entities/user.ts';

const reducer: Reducer<RootState, UserAction, RootEffect> = reducing(userReducer);
const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };

test('setting email returns full state without mutating the previous state', () => {
  const state = initialState();
  Object.freeze(state.user);
  Object.freeze(state);
  const commit = reducer(state, { type: 'UserSetEmailAction', email: user.email });
  expect(commit.state).toEqual({ ...state, user: { ...state.user, email: user.email } });
  expect(commit.state).not.toBe(state);
  expect(commit.effects).toEqual([]);
  expect(state.user.email).toBe('');
});

test('loading only describes a request and its success/error receivers', () => {
  const state = initialState();
  const commit = reducer(state, { type: 'UserLoadAction' });
  expect(commit.state.user.status).toBe('loading');
  expect(state.user.status).toBe('idle');
  expect(commit.effects).toHaveLength(1);
  const effect = commit.effects[0];
  expect(effect.type).toBe('ApiEffect');
  if (effect.type !== 'ApiEffect') throw new Error('Expected API description');
  expect(effect.body).toEqual({ email: '' });
  expect(effect.receiverSuccess(user)).toEqual({ type: 'UserSuccessReceiveAction', response: user });
  expect(effect.receiverError([{ code: 'OFFLINE', message: 'Offline', path: [] }])).toEqual({
    type: 'UserErrorReceiveAction', errors: [{ code: 'OFFLINE', message: 'Offline', path: [] }],
  });
});

test('API error describes a global alert action through an effect', () => {
  const state = initialState();
  const commit = reducer(state, {
    type: 'UserErrorReceiveAction', errors: [{ code: 'OFFLINE', message: 'Offline', path: [] }],
  });
  expect(commit.state.user.status).toBe('error');
  expect(commit.state.alert).toBeNull();
  expect(commit.effects).toEqual([{
    type: 'DispatchActionEffect',
    action: { type: 'ShowAlertAction', status: 'error', message: 'Offline' },
  }]);
});
