import type {
  ApiFailure,
  ApiOperation,
  ApiRequest,
  ApiResponse,
} from '../../api';
import type { AppError } from '../../app-error';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';
import type { ApiOperationEffect } from './api-operation-effect';
import type { apiOperationSchema } from '../../api/types/api-operation-schema';

/** Distribute requests so each method/url keeps its own params and response. */
type LegacyApiEffect<TPaths extends object, TAction extends Trigger> =
  ApiRequest<TPaths> extends infer TRequest
    ? TRequest extends ApiRequest<TPaths>
      ? TRequest & {
          type: 'ApiEffect';
          operation?: never;
          defaultError: AppError;
          onSuccess?: (
            data: ApiResponse<TPaths, TRequest>,
          ) => DispatchAction<TAction>;
          onError?: (
            errors: AppError[],
            failure: ApiFailure,
          ) => DispatchAction<TAction>;
        }
      : never
    : never;

export type ApiEffect<
  TPaths extends object,
  TAction extends Trigger,
  TOperations extends ApiOperation & {
    readonly [apiOperationSchema]?: TPaths;
  } = never,
> = LegacyApiEffect<TPaths, TAction> | ApiOperationEffect<TOperations, TAction>;
