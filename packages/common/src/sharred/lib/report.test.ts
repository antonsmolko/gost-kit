import { expect, test, vi } from 'vitest';
import { report } from './report.ts';

test('report waits for the error handler', async () => {
  const pending = Promise.withResolvers<void>();
  const failure = new Error('Failed');
  const handler = vi.fn(() => pending.promise);
  let completed = false;
  const reporting = report(failure, handler).then(() => { completed = true; });

  expect(handler).toHaveBeenCalledExactlyOnceWith(failure);
  await Promise.resolve();
  expect(completed).toBe(false);
  pending.resolve();
  await reporting;
  expect(completed).toBe(true);
});

test('report logs a synchronous handler failure', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const failure = new Error('Failed');
  const error = new Error('Handler failed');
  try {
    await expect(report(failure, () => { throw error; })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledExactlyOnceWith('Error handler failed', { failure, error });
  } finally {
    log.mockRestore();
  }
});
