import type { FetchResponse } from 'openapi-fetch';
import type { FilterKeys, MediaType } from 'openapi-typescript-helpers';
import type { ApiMethod } from './api-method';

/** Only routing metadata is needed to derive a response, not request options. */
export type ApiResponse<
  TPaths extends object,
  TRequest extends { method: ApiMethod; url: keyof TPaths },
> = TRequest extends {
  method: infer TMethod;
  url: infer TPath extends keyof TPaths;
}
  ? TMethod extends 'head'
    ? undefined
    : FilterKeys<TPaths[TPath], TMethod> extends infer TOperation extends object
      ? FetchResponse<TOperation, {}, MediaType> extends infer TResponse
        ? TResponse extends { data: infer TData } ? TData : never
        : never
      : never
  : never;
