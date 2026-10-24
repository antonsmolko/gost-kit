import { expect, test } from 'vitest';
import { getTriggerName } from './get-trigger-name';

test.each(['LoadAction', 'RequestEffect'] as const)('returns the trigger name: %s', (type) => {
  expect(getTriggerName({ type })).toBe(type);
});

test('accepts triggers with additional payload fields', () => {
  expect(getTriggerName({ type: 'LoadAction', id: 1 })).toBe('LoadAction');
});
