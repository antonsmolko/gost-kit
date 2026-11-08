import { expect, test } from 'vitest';
import { initialState } from './state';
import { appError } from '@gost-kit/common';
import { userState } from '../../features/user/domain/fc/state';

test('root initialization creates separate instances', () => {
  const first = initialState();
  const second = initialState();

  expect(first.user).not.toBe(second.user);
  expect(first.user.errors).not.toBe(second.user.errors);
});

test('composes a user scope override without cloning supplied errors', () => {
  const errors = [appError({ code: 'test', message: 'Failed' })];
  const user = userState({ errors });
  const state = initialState({ user });

  expect(state.user).toBe(user);
  expect(state.user.errors).toBe(errors);
  expect(state.alert).toBeNull();
  expect(initialState().user.errors).toEqual([]);
});
