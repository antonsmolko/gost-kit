import { expect, test } from 'vitest';
import type { Trigger } from '../../fc';
import { getTriggerName } from './get-trigger-name';

test.each(['LoadAction', 'RequestEffect'] as const)('returns the trigger name: %s', (type) => {
  expect(getTriggerName({ type })).toBe(type);
});

test.each([{}, null])('returns a fallback for an invalid runtime trigger: %s', (value) => {
  expect(getTriggerName(value as unknown as Trigger)).toBe('UnknownTrigger');
});
