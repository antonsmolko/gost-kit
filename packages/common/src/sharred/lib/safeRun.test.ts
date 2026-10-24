import { expect, expectTypeOf, test } from 'vitest';
import type { Result } from '../../types';
import { safeRun } from './safeRun';
import { guard } from './guard';

test('sync returns the original value as a successful result', () => {
  const data = { count: 42 };
  const result = safeRun.sync(() => data);
  expectTypeOf(result).toEqualTypeOf<Result<{ count: number }>>();
  expect(result).toEqual({ type: 'ok', data });
  if (result.type === 'ok') expect(result.data).toBe(data);
});

test('sync returns undefined for a callback without a result', () => {
  const result = safeRun.sync(() => {});
  expectTypeOf(result).toEqualTypeOf<Result<undefined>>();
  expect(result).toEqual({ type: 'ok', data: undefined });
});

test.each([new Error('Failed'), 'Failed'])('sync catches an exception: %s', (error) => {
  const expected = guard.error(error) ? { type: 'error', error } : { type: 'error' };
  expect(safeRun.sync(() => { throw error; })).toEqual(expected);
});

test('async returns the resolved value as a successful result', async () => {
  const result = safeRun.async(async () => 42);
  expectTypeOf(result).toEqualTypeOf<Promise<Result<number>>>();
  await expect(result).resolves.toEqual({ type: 'ok', data: 42 });
});

test('async returns undefined for a callback without a result', async () => {
  const result = safeRun.async(async () => {});
  expectTypeOf(result).toEqualTypeOf<Promise<Result<undefined>>>();
  await expect(result).resolves.toEqual({ type: 'ok', data: undefined });
});

test.each([new Error('Failed'), null])('async catches a rejection: %s', async (error) => {
  const expected = guard.nlx(error) ? { type: 'error' } : { type: 'error', error };
  await expect(safeRun.async(() => Promise.reject(error))).resolves.toEqual(expected);
});

test('async catches a synchronous exception from its callback', async () => {
  const error = new Error('Failed before returning a promise');
  await expect(safeRun.async(() => { throw error; })).resolves.toEqual({ type: 'error', error });
});
