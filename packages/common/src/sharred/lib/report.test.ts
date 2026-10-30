import { expect, test, vi } from 'vitest';
import { report } from './report';

test('report calls the error handler synchronously and returns void', () => {
  const failure = new Error('Failed');
  const handler = vi.fn();

  expect(report(failure, handler)).toBeUndefined();
  expect(handler).toHaveBeenCalledExactlyOnceWith(failure);
});

test('report logs a synchronous handler failure', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const failure = new Error('Failed');
  const error = new Error('Handler failed');
  try {
    expect(() => report(failure, () => { throw error; })).not.toThrow();
    expect(log).toHaveBeenCalledExactlyOnceWith('Error handler failed', { failure, error });
  } finally {
    log.mockRestore();
  }
});
