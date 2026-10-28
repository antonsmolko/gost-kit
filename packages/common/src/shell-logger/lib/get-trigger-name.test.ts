import { expect, test } from 'vitest';
import { getTriggerName } from './get-trigger-name';

test.each(['LoadAction', 'RequestEffect'] as const)('returns the trigger name: %s', (type) => {
  expect(getTriggerName({ type })).toBe(type);
});

test('accepts triggers with additional payload fields', () => {
  expect(getTriggerName({ type: 'LoadAction', id: 1 })).toBe('LoadAction');
});

test.each(['users', 'roles'])('includes the namespace of feature actions: %s', (scope) => {
  expect(getTriggerName({ scope, type: 'LoadAction' })).toBe(`${scope}/LoadAction`);
});

test.each([undefined, 'root'])('root actions keep the plain type name: %s', (scope) => {
  expect(getTriggerName({ scope, type: 'LoadAction' })).toBe('LoadAction');
});

test('effects keep their type name even when their payload has a scope field', () => {
  expect(getTriggerName({ scope: 'records', type: 'RequestEffect' })).toBe('RequestEffect');
});
