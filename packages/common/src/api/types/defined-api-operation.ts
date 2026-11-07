import type { AnyFn } from '../../types';
import type { ApiOperationDefinition } from './api-operation-definition';
import type { apiOperationSchema } from './api-operation-schema';
import type { ApiResponse } from './api-response';

export type DefinedApiOperation<
  TPaths extends object,
  TDefinition extends ApiOperationDefinition<TPaths>,
> = {
  readonly method: TDefinition['method'];
  readonly url: TDefinition['url'];
  readonly mapResponse: (
    dto: ApiResponse<TPaths, TDefinition>,
  ) => TDefinition extends { mapResponse: AnyFn<never[], infer TData> }
    ? TData
    : ApiResponse<TPaths, TDefinition>;
  readonly [apiOperationSchema]?: TPaths;
};
