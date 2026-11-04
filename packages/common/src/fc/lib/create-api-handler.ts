import type { ApiClient, ApiMethod, ApiResult } from '../../api';
import type { Ulx } from '../../types';
import type { ApiEffect } from '../types/api-effect';
import type { DispatchAction } from '../types/dispatch-action';
import type { Dispatch } from '../types/dispatch';
import type { Trigger } from '../types/trigger';

export const createApiHandler = <
  TPaths extends object,
  TAction extends Trigger,
>(
  api: ApiClient<TPaths>,
) => {
  return {
    ApiEffect: async ({
      effect,
      dispatch,
    }: {
      effect: ApiEffect<TPaths, TAction>;
      dispatch: Dispatch<TAction>;
    }): Promise<void> => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Omit the effect discriminator from native request options.
        type,
        defaultError,
        onSuccess: success,
        onError,
        method,
        url,
        ...init
      } = effect;

      // The effect union validates method/url/init together. Its dynamic dispatch
      // cannot retain one concrete endpoint's generics; erase only this adapter.
      const result = await (
        api.request as (
          method: ApiMethod,
          url: string,
          init: object,
        ) => Promise<ApiResult<unknown>>
      )(method, url, init);

      if (result.type === 'ok') {
        // The public effect union correlates the callback with the request. A
        // dynamic union call loses that correlation, as in effecting's lookup.
        const onSuccess = success as Ulx<
          (data: unknown) => DispatchAction<TAction>
        >;

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
