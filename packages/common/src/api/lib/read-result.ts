import { guard } from '../../sharred';
import { getMediaType } from './get-media-type';
import { isJsonMediaType } from './is-json-media-type';
import type { ApiClientOptions } from '../types/api-client-options';
import type { ApiMethod } from '../types/api-method';
import type { ApiResult } from '../types/api-result';
import type { TransportData } from '../types/transport-data';
import type { TransportResponse } from '../types/transport-response';

// HEAD has no response body, regardless of a schema's content declaration.
export function readResult<
  TResponse extends TransportResponse<unknown>,
  TMethod extends ApiMethod,
>(
  transport: TResponse,
  method: TMethod,
  mapErrors?: ApiClientOptions['mapErrors'],
): ApiResult<TMethod extends 'head' ? undefined : TransportData<TResponse>>;

export function readResult<TData>(
  transport: TransportResponse<TData>,
  method: ApiMethod,
  mapErrors?: ApiClientOptions['mapErrors'],
): ApiResult<TData | undefined> {
  const { response } = transport;

  if (!response.ok) {
    const body = 'error' in transport ? transport.error : undefined;

    return {
      type: 'error',
      error: {
        kind: 'http',
        status: response.status,
        errors: mapErrors?.(body, response) ?? [],
      },
    };
  }

  if (method === 'head') {
    return {
      type: 'ok',
      data: undefined,
    };
  }

  if ('data' in transport) {
    const { data } = transport;
    const mediaType = getMediaType(response.headers);
    const isEmpty = response.status === 204;
    const isJson = !guard.ulx(data) && isJsonMediaType(mediaType);

    if (isEmpty || isJson) {
      return {
        type: 'ok',
        data,
      };
    }
  }

  return {
    type: 'error',
    error: {
      kind: 'contract',
      status: response.status,
      errors: [],
    },
  };
}
