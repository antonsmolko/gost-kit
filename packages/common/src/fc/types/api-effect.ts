import type { ApiFailure, ApiRequest, ApiResponse } from '../../api';
import type { AppError } from '../../app-error';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';

/** Distribute requests so each method/url keeps its own params and response. */
export type ApiEffect<TPaths extends object, TAction extends Trigger> =
  ApiRequest<TPaths> extends infer TRequest
    ? TRequest extends ApiRequest<TPaths>
      ? TRequest & {
          type: 'ApiEffect';
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
