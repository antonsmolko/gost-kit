import { expect, test } from 'vitest';
import { getMediaType } from './get-media-type';

test.each([
  ['application/json', 'application/json'],
  ['Application/JSON; charset=utf-8', 'application/json'],
  [
    'application/vnd.example+json; profile="https://example.test/a,b"',
    'application/vnd.example+json',
  ],
  ['application/json; profile="a\\",b"', 'application/json'],
])('extracts the media type from %s', (value, expected) => {
  expect(getMediaType(new Headers({ 'Content-Type': value }))).toBe(expected);
});

test.each([
  ['application/json', 'application/json'],
  ['application/json; charset=utf-8', 'application/json'],
  ['application/json; charset=utf-8', 'text/plain'],
  ['application/json; profile="a,b"', 'text/html'],
])('rejects combined singleton values %s and %s', (first, second) => {
  const headers = new Headers();

  headers.append('Content-Type', first);
  headers.append('Content-Type', second);

  expect(getMediaType(headers)).toBeUndefined();
});

test('missing Content-Type has no media type', () => {
  expect(getMediaType(new Headers())).toBeUndefined();
});
