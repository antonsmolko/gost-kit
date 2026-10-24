import { afterEach, expect, test, vi } from 'vitest';
import { logger } from './logger';

afterEach(() => vi.restoreAllMocks());

test('logs a message without an extra payload argument', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  logger().info('Loaded');
  expect(output).toHaveBeenCalledExactlyOnceWith('📟 %cLoaded', 'color:teal;font-weight:bold');
});

test('passes the payload to the console without copying it', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const payload = { count: 1 };
  logger().info('Loaded', payload);
  expect(output.mock.calls[0][2]).toBe(payload);
});

test('uses the configured style', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  logger({ style: 'color:red' }).info('Failed');
  expect(output).toHaveBeenCalledExactlyOnceWith('📟 %cFailed', 'color:red');
});
