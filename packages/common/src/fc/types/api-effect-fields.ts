import type { ApiFailure, ApiOperation } from '../../api';
import type { AppError } from '../../app-error';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';

/** @internal Canonical fields shared by the public effect and its executor. */
export type ApiEffectFields<
  TOperation extends ApiOperation,
  TData,
  TSuccessAction extends Trigger,
  TErrorAction extends Trigger,
> = {
  type: 'ApiEffect';
  operation: TOperation;
  method: TOperation['method'];
  url: TOperation['url'];
  defaultError: AppError;
  onSuccess?: (data: TData) => DispatchAction<TSuccessAction>;
  onError?: (
    errors: AppError[],
    failure: ApiFailure,
  ) => DispatchAction<TErrorAction>;
};
