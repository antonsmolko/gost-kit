import { expect, test } from 'vitest';
import { reducing, scope, type ActionsInScope, type Reducer } from '@gost/common';
import { userReducer } from './reducer';
import { initialState } from '../../../../store/fc/state';
import type { RootState } from '../../../../store/types/state';
import type { RootEffect } from '../../../../store/types/effect';
import type { RootAction } from '../../../../store/types/action';
import type { User } from '../entities/user';

const reducer: Reducer<RootState, ActionsInScope<RootAction, 'users'>, RootEffect> = reducing(scope('user', userReducer));
const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };

test('feature handlers receive and return feature state separately from root state', () => {
  const rootState = initialState();
  const draft = userReducer.SetEmailAction({
    state: rootState.user,
    action: { type: 'SetEmailAction', email: user.email },
  }, rootState);

  expect(draft).toEqual({ state: { ...rootState.user, email: user.email } });
  expect(rootState.user.email).toBe('');
});

test('setting email returns full state without mutating the previous state', () => {
  const state = initialState();
  Object.freeze(state.user);
  Object.freeze(state);
  const commit = reducer(state, { scope: 'users', type: 'SetEmailAction', email: user.email });
  expect(commit.state).toEqual({ ...state, user: { ...state.user, email: user.email } });
  expect(commit.state).not.toBe(state);
  expect(commit.effects).toEqual([]);
  expect(state.user.email).toBe('');
});

test('loading only describes a request and its success/error receivers', () => {
  const state = initialState();
  const commit = reducer(state, { scope: 'users', type: 'LoadAction' });
  expect(commit.state.user.status).toBe('loading');
  expect(state.user.status).toBe('idle');
  expect(commit.effects).toHaveLength(1);
  const effect = commit.effects[0];
  expect(effect.type).toBe('ApiEffect');
  if (effect.type !== 'ApiEffect') throw new Error('Expected API description');
  expect(effect.body).toEqual({ email: '' });
  expect(effect.receiverSuccess(user)).toEqual({ scope: 'users', type: 'SuccessReceiveAction', response: user });
  expect(effect.receiverError([{ code: 'OFFLINE', message: 'Offline', path: [] }])).toEqual({
    scope: 'users', type: 'ErrorReceiveAction', errors: [{ code: 'OFFLINE', message: 'Offline', path: [] }],
  });
});

test('API error describes a global alert action through an effect', () => {
  const state = initialState();
  const commit = reducer(state, {
    scope: 'users', type: 'ErrorReceiveAction', errors: [{ code: 'OFFLINE', message: 'Offline', path: [] }],
  });
  expect(commit.state.user.status).toBe('error');
  expect(commit.state.alert).toBeNull();
  expect(commit.effects).toEqual([{
    type: 'DispatchActionEffect',
    action: { type: 'ShowAlertAction', status: 'error', message: 'Offline' },
  }]);
});
