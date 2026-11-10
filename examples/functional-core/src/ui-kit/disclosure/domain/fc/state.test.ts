import { expect, test } from 'vitest';
import { disclosureState } from './state';

test('creates fresh closed defaults per call', () => {
  const first = disclosureState();
  const second = disclosureState();

  expect(first).toEqual({ open: false });
  expect(second).toEqual({ open: false });
  expect(first).not.toBe(second);
});

test('accepts an explicit initial open value', () => {
  expect(disclosureState({ open: true })).toEqual({ open: true });
});
