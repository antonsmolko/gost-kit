import type { PathsWithMethod } from 'openapi-typescript-helpers';
import type { ApiMethod } from './api-method';
import type { ApiResponse } from './api-response';
import type { ApiResponsePipeline } from './api-response-pipeline';

export type ApiOperationDefinition<TPaths extends object> = {
  [TMethod in ApiMethod]: {
    [TUrl in PathsWithMethod<TPaths, TMethod> & string]: {
      readonly method: TMethod;
      readonly url: TUrl;
    } & (
      | {
          readonly mapResponse?: (
            dto: ApiResponse<TPaths, { method: TMethod; url: TUrl }>,
          ) => unknown;
          readonly response?: never;
        }
      | {
          readonly response: ApiResponsePipeline<
            ApiResponse<TPaths, { method: TMethod; url: TUrl }>,
            unknown
          >;
          readonly mapResponse?: never;
        }
    );
  }[PathsWithMethod<TPaths, TMethod> & string];
}[ApiMethod];
