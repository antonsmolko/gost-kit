import type { ApiOperation } from './api-operation';

/** A dynamic choice must be narrowed before binding endpoint-specific options. */
export type SingleApiOperation<
  TOperation extends ApiOperation,
  TWhole = TOperation,
> = TOperation extends ApiOperation
  ? [TWhole] extends [TOperation]
    ? TOperation
    : never
  : never;
