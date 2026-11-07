import type {
  ApiFailure,
  ApiOperation,
  ApiOperationData,
  ApiOperationOptions,
} from '../../api';
import type { AppError } from '../../app-error';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';

export type ApiOperationEffect<
  TOperation extends ApiOperation,
  TAction extends Trigger,
> = TOperation extends ApiOperation
  ? ApiOperationOptions<TOperation> & {
      type: 'ApiEffect';
      operation: TOperation;
      method: TOperation['method'];
      url: TOperation['url'];
      defaultError: AppError;
      onSuccess?: (
        data: ApiOperationData<TOperation>,
      ) => DispatchAction<TAction>;
      onError?: (
        errors: AppError[],
        failure: ApiFailure,
      ) => DispatchAction<TAction>;
    }
  : never;
