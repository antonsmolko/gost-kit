import createClient, { type MaybeOptionalInit } from 'openapi-fetch';
import type { PathsWithMethod } from 'openapi-typescript-helpers';
import { report } from '../../sharred';
import { captureRequestResult } from './capture-request-result';
import { readResult } from './read-result';
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

      const result = await captureRequestResult(() => {
        return client.request<TMethod, TPath, TInit>(method, url, ...init);
      }, requestOptions?.signal);

      // openapi-fetch owns decoding; schema-derived types are not runtime validators.
      const apiResult =
        result.type === 'error'
          ? result
          : readResult(result.data, method, mapErrors);

      if (apiResult.type === 'error' && onFailure) {
        report(apiResult.error, onFailure);
      }

      return apiResult;
    },
  };
};
