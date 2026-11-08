import { expect, test } from 'vitest';
import { userState } from '../domain/fc/state';
import type { User } from '../domain/entities/user';
import { userPresenter } from './user.presenter';

test.each([
  ['idle', false],
  ['loading', true],
  ['ready', false],
  ['error', false],
] as const)('presents form state for status %s', (status, isLoading) => {
  const state = userState({ email: 'ada@example.test', status });

  expect(userPresenter({ state })).toEqual({
    email: 'ada@example.test',
    status,
    isLoading,
    loadedUser: null,
    hasLoadedUser: false,
    loadedUserName: '',
    loadedUserEmail: '',
  });
});

test.each(['idle', 'ready', 'loading', 'error'] as const)(
  'keeps the loaded user available during %s',
  (status) => {
    const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };
    const state = userState({ status, data: user });

    const view = userPresenter({ state });

    expect(view.loadedUser).toBe(user);
    expect(view.hasLoadedUser).toBe(true);
    expect(view.loadedUserName).toBe('Ada');
    expect(view.loadedUserEmail).toBe('ada@example.test');
  },
);

test('returns deterministic view data without changing the input state', () => {
  const data = Object.freeze({
    id: '1',
    name: 'Ada',
    email: 'ada@example.test',
  });
  const errors = Object.freeze([
    { code: 'OFFLINE', message: 'Offline', path: [] },
  ]);
  const state = Object.freeze(
    userState({
      email: 'next@example.test',
      status: 'error',
      data,
      errors,
    }),
  );

  const expected = {
    email: 'next@example.test',
    status: 'error',
    isLoading: false,
    loadedUser: data,
    hasLoadedUser: true,
    loadedUserName: 'Ada',
    loadedUserEmail: 'ada@example.test',
  };

  expect(userPresenter({ state })).toEqual(expected);
  expect(userPresenter({ state })).toEqual(expected);
  expect(state).toEqual({
    email: 'next@example.test',
    status: 'error',
    data,
    errors,
  });
  expect(state.data).toBe(data);
  expect(state.errors).toBe(errors);
});
