import { afterEach, expect, test, vi } from 'vitest';
import { logger } from './logger';
import { format } from 'node:util';

afterEach(() => vi.restoreAllMocks());

test('logs a message without an extra payload argument', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  logger().info('Loaded');
  expect(output).toHaveBeenCalledExactlyOnceWith('📟 %c%s', 'color:teal;font-weight:bold', 'Loaded');
});

test('passes the payload to the console without copying it', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const payload = { count: 1 };
  logger().info('Loaded', payload);
  expect(output.mock.calls[0][3]).toBe(payload);
});

test('uses the configured style', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  logger({ style: 'color:red' }).info('Failed');
  expect(output).toHaveBeenCalledExactlyOnceWith('📟 %c%s', 'color:red', 'Failed');
});

test.each(['Loaded %s rows', 'Styled %c object %o', 'Progress 100%', 'Progress 100%%'])('keeps message placeholders literal: %s', (message) => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const payload = { count: 3 };
  logger().info(message, payload);

  const [pattern, style, title, data] = output.mock.calls[0];
  expect(format(pattern, style, title)).toBe(`📟 ${message}`);
  expect(title).toBe(message);
  expect(data).toBe(payload);
});
