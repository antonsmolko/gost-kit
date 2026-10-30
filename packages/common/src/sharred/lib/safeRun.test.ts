import { expect, expectTypeOf, test } from 'vitest';
import type { Result } from '../../types';
import { safeRun } from './safeRun';

const reasons = ['timeout', null, undefined, 17, { code: 'OFFLINE' }];

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

test('sync preserves the original Error instance', () => {
  const error = new Error('Failed');
  const result = safeRun.sync(() => { throw error; });
  expect(result.type).toBe('error');
  if (result.type === 'error') expect(result.error).toBe(error);
});

test.each(reasons)('sync preserves a non-Error reason as cause: %s', (reason) => {
  const result = safeRun.sync(() => { throw reason; });
  expect(result.type).toBe('error');
  if (result.type === 'error') {
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error).toHaveProperty('cause');
    expect(result.error?.cause).toBe(reason);
  }
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

test('async preserves the original Error instance', async () => {
  const error = new Error('Failed');
  const result = await safeRun.async(() => Promise.reject(error));
  expect(result.type).toBe('error');
  if (result.type === 'error') expect(result.error).toBe(error);
});

test.each(reasons)('async preserves a non-Error rejection as cause: %s', async (reason) => {
  const result = await safeRun.async(() => Promise.reject(reason));
  expect(result.type).toBe('error');
  if (result.type === 'error') {
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error).toHaveProperty('cause');
    expect(result.error?.cause).toBe(reason);
  }
});

test('async catches a synchronous exception from its callback', async () => {
  const error = new Error('Failed before returning a promise');
  await expect(safeRun.async(() => { throw error; })).resolves.toEqual({ type: 'error', error });
});
