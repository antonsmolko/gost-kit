import type {
  ApiFailure,
  ApiOperation,
  ApiOperationData,
  ApiOperationOptions,
  SingleApiOperation,
} from '../../api';
import type { AppError } from '../../app-error';
import type { Trigger } from '../types/trigger';

export const createApiEffect = <
  const TOperation extends ApiOperation,
  const TSuccessAction extends Trigger = never,
  const TErrorAction extends Trigger = never,
>(
  operation: TOperation,
  options: ApiOperationOptions<NoInfer<TOperation>> & {
    type?: never;
    method?: never;
    url?: never;
    operation?: never;
    defaultError: AppError;
    onSuccess?: (data: ApiOperationData<NoInfer<TOperation>>) => TSuccessAction;
    onError?: (errors: AppError[], failure: ApiFailure) => TErrorAction;
  },
  // Keep inference on the first argument: an unresolved operation union cannot
  // be paired with request options that satisfy only one possible endpoint.
  ..._operationCheck: [SingleApiOperation<TOperation>] extends [never]
    ? [unresolvedOperation: never]
    : []
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
