import type { AnyFn } from '../../types';
import type { ApiMethod } from './api-method';
import type { apiOperationSchema } from './api-operation-schema';

/** Common structural constraint; use typeof your operation to retain its schema. */
export type ApiOperation = {
  readonly method: ApiMethod;
  readonly url: string;
  readonly mapResponse: AnyFn;
  readonly [apiOperationSchema]?: object;
};
