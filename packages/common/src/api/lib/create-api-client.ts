import createClient, { type MaybeOptionalInit } from 'openapi-fetch';
import type { PathsWithMethod } from 'openapi-typescript-helpers';
import { executeRequest } from './execute-request';
import { readResult } from './read-result';
import type { ApiClientOptions } from '../types/api-client-options';
import type { ApiInit } from '../types/api-init';
import type { ApiMethod } from '../types/api-method';

export const createApiClient = <TPaths extends object>({
  mapErrors,
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

      const execution = await executeRequest(() => {
        return client.request<TMethod, TPath, TInit>(method, url, ...init);
      }, requestOptions?.signal);

      if (execution.type === 'error') {
        return execution;
      }

      // openapi-fetch owns decoding; schema-derived types are not runtime validators.
      return readResult(execution.data, method, mapErrors);
    },
  };
};
