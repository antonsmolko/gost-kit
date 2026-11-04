import { afterEach, expect, test, vi } from 'vitest';
import { fakeApi } from './fake-api';

afterEach(() => {
  vi.useRealTimers();
});

test('demo user response preserves the 400ms delay', async () => {
  vi.useFakeTimers();

  let settled = false;
  const pending = fakeApi
    .request('post', '/user', { body: { email: 'ada@example.test' } })
    .then((result) => {
      settled = true;

      return result;
    });

  await vi.advanceTimersByTimeAsync(399);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(1);

  expect(await pending).toEqual({
    type: 'ok',
    data: { id: '1', name: 'Ada Lovelace', email: 'ada@example.test' },
  });
});

test('configured demo failure remains a normalized network result', async () => {
  vi.useFakeTimers();

  const pending = fakeApi.request('post', '/user', {
    body: { email: 'error@example.test' },
  });

  await vi.advanceTimersByTimeAsync(400);

  expect(await pending).toEqual({
    type: 'error',
    error: { kind: 'network', errors: [] },
  });
});
