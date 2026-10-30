import { toErrorResult } from './to-error-result';
import type { Result, AsyncFn, AnyFn } from '../../types';

type Fix<TResult> = TResult extends void ? undefined : TResult;

export const safeRun = {
  async: async <TResult = undefined>(fn: AsyncFn<[], TResult>): Promise<Result<Fix<TResult>>> => {
    try {
      const data = await fn();

      return {
        type: 'ok',
        data: data as Fix<TResult>,
      };
    } catch (error) {
      return toErrorResult(error);
    }
  },
  sync: <TResult = undefined>(fn: AnyFn<[], TResult>): Result<Fix<TResult>> => {
    try {
      const data = fn();

      return {
        type: 'ok',
        data: data as Fix<TResult>,
      };
    } catch (error) {
      return toErrorResult(error);
    }
  },
};
