import type { Ulx } from '../../types';

export const getMediaType = (headers: Headers): Ulx<string> => {
  return headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
};
