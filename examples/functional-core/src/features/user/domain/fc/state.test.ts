import { expect, test } from 'vitest';
import { userState } from './state';

test('feature state accepts initial data', () => {
  expect(userState({ email: 'ada@example.test' })).toEqual({
    email: 'ada@example.test', status: 'idle', data: null, errors: [],
  });
});
