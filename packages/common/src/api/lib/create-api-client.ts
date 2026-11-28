import createClient, { type MaybeOptionalInit } from 'openapi-fetch';
import type { PathsWithMethod } from 'openapi-typescript-helpers';
import { report } from '../../sharred';
import { captureRequest } from './capture-request';
import { prepareResult } from './prepare-result';
import type { ApiClientOptions } from '../types/api-client-options';
import type { ApiInit } from '../types/api-init';
import type { ApiMethod } from '../types/api-method';

export const createApiClient = <TPaths extends object>({
  mapErrors,
  onFailure,
  ...options
}: ApiClientOptions) => {
  const client = createClient<TPaths>(options);

  return {
    request: async <
      TMethod extends ApiMethod & keyof TPaths[TPath],
      TPath extends PathsWithMethod<TPaths, TMethod> & string,
      TInit extends MaybeOptionalInit<TPaths[TPath], TMethod>,
    >(
      method: TMethod,
      url: TPath,
      ...init: ApiInit<TInit>
    ) => {
      const [requestOptions] = init;

      const apiResult = await captureRequest(() => {
        return client.request<TMethod, TPath, TInit>(method, url, ...init);
      }, requestOptions?.signal);

      const result = prepareResult(apiResult, method, mapErrors);

      if (result.type === 'error' && onFailure) {
        report(result.error, onFailure);
      }

      return result;
    },
  };
};
