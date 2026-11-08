import { expect, test } from 'vitest';
import { mapUser } from './map-user';

test('converts schema DTO to a distinct domain shape', () => {
  expect(
    mapUser({ user_id: 1, full_name: 'Ada', email: 'ada@example.test' }),
  ).toEqual({ id: '1', name: 'Ada', email: 'ada@example.test' });
});
