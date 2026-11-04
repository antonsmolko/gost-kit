import { guard } from '../../sharred';
import type { Ulx } from '../../types';

export const isJsonMediaType = (mediaType: Ulx<string>): boolean => {
  return (
    guard.string(mediaType) &&
    /^application\/(?:[\w.+-]+\+)?json$/.test(mediaType)
  );
};
