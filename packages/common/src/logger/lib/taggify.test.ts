import { expect, test } from 'vitest';
import { taggify } from './taggify';

test('joins tags in order, keeps zero and ignores null and undefined', () => {
  expect(taggify('user', null, 0, undefined, 'load', 42)).toBe('user 0 load 42');
});

test('returns an empty string when no tags remain', () => {
  expect(taggify()).toBe('');
  expect(taggify(null, undefined)).toBe('');
});
