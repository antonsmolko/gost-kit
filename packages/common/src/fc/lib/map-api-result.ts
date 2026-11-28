import type { ApiOperation, ApiResult } from '../../api';
import type { AnyFn } from '../../types';

/** Run response validation and mapping before effect callbacks. */
export const mapApiResult = async (
  result: ApiResult<unknown>,
  operation: ApiOperation,
): Promise<ApiResult<unknown>> => {
  if (result.type === 'error') {
    return result;
  }

  // Operation types correlate DTO and mapper at construction. The dynamic handler
  // erases that endpoint once, after the schema-typed request has completed.
  const mapResponse = operation.mapResponse as AnyFn<[unknown]>;

  try {
    const errors = operation.validateResponse?.(result.data);

    if (errors?.length) {
      return { type: 'error', error: { kind: 'contract', errors } };
    }

    return { type: 'ok', data: await mapResponse(result.data) };
  } catch {
    return { type: 'error', error: { kind: 'contract', errors: [] } };
  }
};
