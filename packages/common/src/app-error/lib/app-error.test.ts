import { expect, test } from 'vitest';
import { appError } from './app-error';

test('creates defaults with a separate path for each error', () => {
  const first = appError();
  const second = appError();
  expect(first).toEqual({ code: '', message: '', path: [] });
  expect(first).not.toBe(second);
  expect(first.path).not.toBe(second.path);
});

test('uses supplied fields without modifying the input', () => {
  const data = Object.freeze({ code: 'INVALID_EMAIL', path: ['user', 'email'] });
  expect(appError(data)).toEqual({ ...data, message: '' });
  expect(appError({ message: 'Invalid email' })).toEqual({
    code: '', message: 'Invalid email', path: [],
  });
});
