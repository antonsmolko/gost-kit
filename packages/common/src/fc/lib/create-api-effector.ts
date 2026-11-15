import type { ApiClient, ApiMethod, ApiResult, ApiOperation } from '../../api';
import type { ApiEffect } from '../types/api-effect';
import type { ApiEffectFields } from '../types/api-effect-fields';
import type { EffectorHandlers } from '../types/effector-handlers';
import type { Trigger } from '../types/trigger';
import type { apiOperationSchema } from '../../api/types/api-operation-schema';
import { mapApiResult } from './map-api-result';
import { define } from './define';

export const createApiEffector = <
  TPaths extends object,
  TAction extends Trigger,
  TOperation extends ApiOperation & {
    readonly [apiOperationSchema]?: TPaths;
  },
>(
  api: ApiClient<TPaths>,
): EffectorHandlers<TAction, ApiEffect<TOperation, TAction, TAction>> => {
  // Keep endpoint-specific request constraints in the public return type;
  // the shared definition helper checks the executor's canonical fields.
  return define.effector<
    TAction,
    ApiEffectFields<TOperation, never, TAction, TAction>
  >({
    ApiEffect: async ({ effect, dispatch }) => {
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
      } = effect;

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
          // The public effect correlates this callback with the operation's
          // mapped data. Only the dynamic payload loses that correlation here.
          await dispatch(onSuccess(result.data as never));
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
  });
};
