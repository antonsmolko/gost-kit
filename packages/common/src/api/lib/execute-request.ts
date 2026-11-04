import { normalizeError } from './normalize-error';
import type { AsyncFn, Nlx } from '../../types';
import type { ApiResult } from '../types/api-result';

export const executeRequest = async <TResponse>(
  operation: AsyncFn<[], TResponse>,
  signal?: Nlx<AbortSignal>,
): Promise<ApiResult<TResponse>> => {
  try {
    const data = await operation();

    return {
      type: 'ok',
      data,
    };
  } catch (error) {
    return {
      type: 'error',
      error: normalizeError(error, signal),
    };
  }
};
