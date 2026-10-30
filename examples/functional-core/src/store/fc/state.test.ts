import { expect, test } from 'vitest';
import { initialState } from './state';

test('root initialization creates separate instances', () => {
  const first = initialState();
  const second = initialState();
  expect(first.user).not.toBe(second.user);
  expect(first.user.errors).not.toBe(second.user.errors);
});
