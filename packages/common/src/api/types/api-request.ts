import type { FetchOptions } from 'openapi-fetch';
import type { FilterKeys, PathsWithMethod } from 'openapi-typescript-helpers';
import type { ApiMethod } from './api-method';

export type ApiRequest<TPaths extends object> = {
  [TMethod in ApiMethod]: {
    [TUrl in PathsWithMethod<TPaths, TMethod> & string]: {
      method: TMethod;
      url: TUrl;
    } & Omit<
      FetchOptions<FilterKeys<TPaths[TUrl], TMethod>>,
      'method' | 'parseAs'
    > & {
        parseAs?: 'json';
      };
  }[PathsWithMethod<TPaths, TMethod> & string];
}[ApiMethod];
