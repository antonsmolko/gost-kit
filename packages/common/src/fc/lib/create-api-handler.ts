import type {
  ApiClient,
  ApiMethod,
  ApiResult,
  ApiOperation,
  ApiFailure,
} from '../../api';
import type { Rec } from '../../types';
import type { AppError } from '../../app-error';
import type { ApiEffect } from '../types/api-effect';
import type { DispatchAction } from '../types/dispatch-action';
import type { Dispatch } from '../types/dispatch';
import type { Trigger } from '../types/trigger';
import type { apiOperationSchema } from '../../api/types/api-operation-schema';
import { mapApiResult } from './map-api-result';

// The public effect retains endpoint correlation; execution needs one uniform
// shape after the caller's schema/operation/action contracts have been checked.
type RuntimeApiEffect<TAction extends Trigger> = Rec & {
  type: 'ApiEffect';
  operation: ApiOperation;
  method: ApiMethod;
  url: string;
  defaultError: AppError;
  onSuccess?: (data: unknown) => DispatchAction<TAction>;
  onError?: (
    errors: AppError[],
    failure: ApiFailure,
  ) => DispatchAction<TAction>;
};

export const createApiHandler = <
  TPaths extends object,
  TAction extends Trigger,
  TOperations extends ApiOperation & {
    readonly [apiOperationSchema]?: TPaths;
  },
>(
  api: ApiClient<TPaths>,
) => {
  return {
    ApiEffect: async ({
      effect,
      dispatch,
    }: {
      effect: ApiEffect<TOperations, TAction>;
      dispatch: Dispatch<TAction>;
    }): Promise<void> => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Omit the effect discriminator from native request options.
        type,
        operation,
        defaultError,
        onSuccess,
        onError,
        method,
        url,
        ...init
      } = effect as unknown as RuntimeApiEffect<TAction>;

      // The effect union validates method/url/init together. Its dynamic dispatch
      // cannot retain one concrete endpoint's generics; erase only this adapter.
      const response = await (
        api.request as (
          method: ApiMethod,
          url: string,
          init: object,
        ) => Promise<ApiResult<unknown>>
      )(method, url, init);
      const result = await mapApiResult(response, operation);

      if (result.type === 'ok') {
        if (onSuccess) {
          await dispatch(onSuccess(result.data));
        }

        return;
      }

      if (!onError) {
        throw result.error;
      }

      const errors = result.error.errors.length
        ? result.error.errors
        : [defaultError];

      await dispatch(onError(errors, result.error));
    },
  };
};
