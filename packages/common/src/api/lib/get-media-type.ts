import { guard } from '../../sharred';
import type { Ulx } from '../../types';

export const getMediaType = (headers: Headers): Ulx<string> => {
  const value = headers.get('Content-Type');

  if (guard.nlx(value)) {
    return undefined;
  }

  // Content-Type is a singleton. Reject combined fields, preserving commas
  // inside quoted parameters (including escaped quotes).
  if (value.replace(/"(?:[^"\\]|\\.)*"/gu, '').includes(',')) {
    return undefined;
  }

  return value.split(';')[0].trim().toLowerCase();
};
