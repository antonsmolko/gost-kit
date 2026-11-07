import type { ApiOperation, ApiResult } from '../../api';
import type { AnyFn, Ulx } from '../../types';

/** Catch only response mapping; callbacks and dispatch retain their own errors. */
export const mapApiResult = async (
  result: ApiResult<unknown>,
  operation: Ulx<ApiOperation>,
): Promise<ApiResult<unknown>> => {
  if (result.type === 'error' || !operation) {
    return result;
  }

  // Operation types correlate DTO and mapper at construction. The dynamic handler
  // erases that endpoint once, after the schema-typed request has completed.
  const mapResponse = operation.mapResponse as AnyFn<[unknown]>;

  try {
    return { type: 'ok', data: await mapResponse(result.data) };
  } catch {
    return { type: 'error', error: { kind: 'contract', errors: [] } };
  }
};
