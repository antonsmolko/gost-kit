import type { Nil } from '../../types';
import { guard } from '../../sharred';


export const taggify = (...tags: Nil<string | number>[]) => {
  return tags.filter(guard.not.nil).join(' ');
};