import type {
  ApiFailure,
  ApiOperation,
  ApiOperationData,
  ApiOperationOptions,
} from '../../api';
import type { AppError } from '../../app-error';
import type { Trigger } from '../types/trigger';

export const createApiEffect = <
  const TOperation extends ApiOperation,
  const TSuccess extends Trigger = never,
  const TFailure extends Trigger = never,
>(
  operation: TOperation,
  options: ApiOperationOptions<NoInfer<TOperation>> & {
    type?: never;
    method?: never;
    url?: never;
    operation?: never;
    defaultError: AppError;
    onSuccess?: (data: ApiOperationData<NoInfer<TOperation>>) => TSuccess;
    onError?: (errors: AppError[], failure: ApiFailure) => TFailure;
  },
) => {
  const { method, url }: Pick<TOperation, 'method' | 'url'> = operation;

  return {
    ...options,
    type: 'ApiEffect' as const,
    operation,
    method,
    url,
  };
};
