import type { RequiredKeysOf } from 'openapi-typescript-helpers';
import type { Rec } from '../../types';

/** Preserve upstream optional/required init arguments, limiting parsing to JSON. */
export type ApiInit<TInit> = RequiredKeysOf<TInit> extends never
  ? [(TInit & Rec & { parseAs?: 'json' })?]
  : [TInit & Rec & { parseAs?: 'json' }];
