import { afterEach, expect, test, vi } from 'vitest';
import { logInfoAsync } from './log-info-async';

afterEach(() => vi.restoreAllMocks());

test('uses the trigger name and logs a snapshot of the payload', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const payload = { trigger: { type: 'LoadAction' as const }, state: { count: 1 } };
  logInfoAsync(payload);
  payload.state.count = 2;
  await Promise.resolve();
  expect(output).toHaveBeenCalledExactlyOnceWith(
    '📟 %c%s', expect.any(String), 'LoadAction',
    { trigger: { type: 'LoadAction' }, state: { count: 1 } },
  );
});

test('a serialization failure does not escape or write an incomplete log', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  // BigInt cannot be serialized with JSON.stringify.
  expect(() => logInfoAsync({ trigger: { type: 'LoadAction' }, value: 1n })).not.toThrow();
  await Promise.resolve();
  expect(output).not.toHaveBeenCalled();
});

test('a console failure does not escape logging', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => { throw new Error('Console failed'); });
  expect(() => logInfoAsync({ trigger: { type: 'LoadAction' } })).not.toThrow();
  await Promise.resolve();
});
