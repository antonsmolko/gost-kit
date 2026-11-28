import Result from 'true-myth/result';
import { normalizeError } from './normalize-error';
import type { AsyncFn, Nlx } from '../../types';
import type { ApiFailure } from '../types/api-failure';

export const captureRequestResult = async <TResponse>(
  operation: AsyncFn<[], TResponse>,
  signal?: Nlx<AbortSignal>,
): Promise<Result<TResponse, ApiFailure>> => {
  try {
    const data = await operation();

    return Result.ok(data);
  } catch (error) {
    return Result.err(normalizeError(error, signal));
  }
};
