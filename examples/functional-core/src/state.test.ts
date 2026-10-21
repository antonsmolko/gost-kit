import { expect, test } from 'vitest';
import { initialState, userState } from './state.ts';

test('feature state accepts initial data and root initialization creates separate instances', () => {
  expect(userState({ email: 'ada@example.test' })).toEqual({
    email: 'ada@example.test', status: 'idle', data: null, errors: [],
  });
  const first = initialState();
  const second = initialState();
  expect(first.user).not.toBe(second.user);
  expect(first.user.errors).not.toBe(second.user.errors);
});
