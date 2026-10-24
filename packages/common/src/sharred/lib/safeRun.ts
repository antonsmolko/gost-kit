import { guard } from './guard';
import type { Result, AsyncFn } from '../../types';

type Fix<T> = T extends void ? undefined : T;

export const safeRun = {
  async: async <TResult = undefined>(fn: AsyncFn<[], TResult>): Promise<Result<Fix<TResult>>> => {
    try {
      const data = await fn();

      return {
        type: 'ok',
        data: data as Fix<TResult>,
      };
    } catch (error) {
      if (guard.error(error)) {
        return {
          type: 'error',
          error,
        };
      }

      return {
        type: 'error',
      };
    }
  },
  sync: <T = undefined>(fn: () => T): Result<Fix<T>> => {
    try {
      const data = fn();

      return {
        type: 'ok',
        data: data as Fix<T>,
      };
    } catch (error) {
      if (guard.error(error)) {
        return {
          type: 'error',
          error,
        };
      }

      return {
        type: 'error',
      };
    }
  },
};
