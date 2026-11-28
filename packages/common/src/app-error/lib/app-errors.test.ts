import { expect, test } from 'vitest';
import { appError, appErrors } from '..';

test('returns every exact match in input order', () => {
  const path = ['items', '1', 'name'] as const;
  const first = appError({ path, message: 'Enter a name' });
  const second = appError({ path, message: 'Name is too short' });
  const dotted = appError({ path: ['items.1.name'], message: 'Dotted key' });
  const errors = [first, dotted, second] as const;

  expect(appErrors.get({ errors, path })).toEqual([first, second]);
  expect(appErrors.getMessages({ errors, path })).toEqual([
    'Enter a name',
    'Name is too short',
  ]);
  expect(appErrors.getOne({ errors, path })).toBe(first);
  expect(appErrors.getMessage({ errors, path })).toBe('Enter a name');
  expect(
    appErrors.getOne({ errors, path: ['items', '01', 'name'] }),
  ).toBeUndefined();
  expect(appErrors.get({ errors, path: ['items', '1'] })).toEqual([]);
});

test('selects the path and its descendants by whole segments', () => {
  const path = ['items', '1'] as const;
  const row = appError({ path, message: 'Check this row' });
  const name = appError({ path: [...path, 'name'], message: 'Enter a name' });
  const other = appError({
    path: ['items', '10', 'name'],
    message: 'Other row',
  });
  const parent = appError({ path: ['items'], message: 'Check all items' });
  const errors = [parent, row, other, name];

  expect(appErrors.get({ errors, path, match: 'prefix' })).toEqual([row, name]);
  expect(appErrors.getOne({ errors, path, match: 'prefix' })).toBe(row);
  expect(appErrors.getMessage({ errors, path, match: 'prefix' })).toBe(
    'Check this row',
  );
  expect(appErrors.getMessages({ errors, path, match: 'prefix' })).toEqual([
    'Check this row',
    'Enter a name',
  ]);
});

test('uses an empty path for form errors or all errors in prefix mode', () => {
  const field = appError({ path: ['name'], message: 'Enter a name' });
  const form = appError({ message: 'Check the form' });
  const errors = [field, form] as const;

  expect(appErrors.get({ errors, path: [] })).toEqual([form]);
  expect(appErrors.get({ errors, path: [], match: 'prefix' })).toEqual(errors);
  expect(appErrors.getMessages({ errors: [], path: [] })).toEqual([]);
});

test('distinguishes a missing match from an empty error message', () => {
  const error = appError({ path: ['name'] });
  const errors = [error];

  expect(appErrors.getOne({ errors: [], path: error.path })).toBeUndefined();
  expect(appErrors.getMessage({ errors, path: ['email'] })).toBeUndefined();
  expect(appErrors.getMessage({ errors, path: error.path })).toBe('');
});
