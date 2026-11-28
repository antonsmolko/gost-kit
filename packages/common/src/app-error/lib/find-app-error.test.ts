import { expect, test } from 'vitest';
import { appError, findAppError, findAppErrorMessage } from '..';

test('finds the first error for the exact nested path', () => {
  const parent = appError({ path: ['items', '0'], message: 'Invalid item' });
  const first = appError({
    path: ['items', '0', 'name'],
    message: 'Enter a name',
  });
  const second = appError({
    path: ['items', '0', 'name'],
    message: 'Name is too short',
  });
  const errors = [parent, first, second] as const;
  const path = ['items', '0', 'name'] as const;

  expect(findAppError(errors, path)).toBe(first);
  expect(findAppErrorMessage(errors, path)).toBe('Enter a name');
  expect(findAppError(errors, ['items', '1', 'name'])).toBeUndefined();
  expect(findAppError(errors, ['items', '00', 'name'])).toBeUndefined();
  expect(findAppError(errors, ['items'])).toBeUndefined();
});

test('finds an error with an empty path for the entire form', () => {
  const field = appError({ path: ['name'], message: 'Enter a name' });
  const form = appError({ message: 'Could not save the form' });

  expect(findAppError([field, form], [])).toBe(form);
  expect(findAppErrorMessage([field, form], [])).toBe(
    'Could not save the form',
  );
  expect(findAppErrorMessage([field], [])).toBeUndefined();
});

test('distinguishes a missing error from an empty error message', () => {
  const error = appError({ path: ['name'] });

  expect(findAppError([], error.path)).toBeUndefined();
  expect(findAppErrorMessage([error], error.path)).toBe('');
  expect(findAppErrorMessage([error], ['email'])).toBeUndefined();
});
