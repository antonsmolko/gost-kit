import { expect, test } from 'vitest';
import { reducer } from './reducer.ts';
import { initialState } from './state.ts';
import type { User } from './types.ts';

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
  expect(effect.receiverError?.([{ message: 'Offline' }])).toEqual({
    type: 'UserErrorReceiveAction', errors: [{ message: 'Offline' }],
  });
});

test('API error describes a global alert action through an effect', () => {
  const state = initialState();
  const commit = reducer(state, {
    type: 'UserErrorReceiveAction', errors: [{ message: 'Offline' }],
  });
  expect(commit.state.user.status).toBe('error');
  expect(commit.state.alert).toBeNull();
  expect(commit.effects).toEqual([{
    type: 'DispatchActionEffect',
    action: { type: 'ShowAlertAction', status: 'error', message: 'Offline' },
  }]);
});

test('global alert actions update application state outside user state', () => {
  const state = initialState();
  const shown = reducer(state, { type: 'ShowAlertAction', status: 'error', message: 'Offline' });
  expect(shown.state.user).toBe(state.user);
  expect(shown.state.alert?.message).toBe('Offline');
  expect(reducer(shown.state, { type: 'DismissAlertAction' }).state.alert).toBeNull();
});
