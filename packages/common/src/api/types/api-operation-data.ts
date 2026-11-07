import type { ApiOperation } from './api-operation';

export type ApiOperationData<TOperation extends ApiOperation> = Awaited<
  ReturnType<TOperation['mapResponse']>
>;
