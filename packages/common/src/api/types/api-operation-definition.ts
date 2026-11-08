import type { PathsWithMethod } from 'openapi-typescript-helpers';
import type { ApiMethod } from './api-method';
import type { ApiResponse } from './api-response';

export type ApiOperationDefinition<TPaths extends object> = {
  [TMethod in ApiMethod]: {
    [TUrl in PathsWithMethod<TPaths, TMethod> & string]: {
      readonly method: TMethod;
      readonly url: TUrl;
      readonly mapResponse?: (
        dto: ApiResponse<TPaths, { method: TMethod; url: TUrl }>,
      ) => unknown;
    };
  }[PathsWithMethod<TPaths, TMethod> & string];
}[ApiMethod];
