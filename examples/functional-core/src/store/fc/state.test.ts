import { expect, test } from 'vitest';
import { initialState } from './state.ts';

test('root initialization creates separate instances', () => {
  const first = initialState();
  const second = initialState();
  expect(first.user).not.toBe(second.user);
  expect(first.user.errors).not.toBe(second.user.errors);
});
