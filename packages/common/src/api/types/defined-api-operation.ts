import type { AnyFn } from '../../types';
import type { ApiOperationDefinition } from './api-operation-definition';
import type { apiOperationSchema } from './api-operation-schema';
import type { ApiResponse } from './api-response';
import type { ApiResponsePipeline } from './api-response-pipeline';
import type { ApiResponseValidator } from './api-response-validator';

export type DefinedApiOperation<
  TPaths extends object,
  TDefinition extends ApiOperationDefinition<TPaths>,
> =
  TDefinition extends ApiOperationDefinition<TPaths>
    ? {
        readonly method: TDefinition['method'];
        readonly url: TDefinition['url'];
        readonly validateResponse?: ApiResponseValidator;
        readonly mapResponse: (
          dto: ApiResponse<TPaths, TDefinition>,
        ) => TDefinition extends {
          response: ApiResponsePipeline<never, infer TData>;
        }
          ? TData
          : TDefinition extends { mapResponse: AnyFn<never[], infer TData> }
            ? TData
            : | ApiResponse<TPaths, TDefinition>
              | ('response' extends keyof TDefinition
                  ? ReturnType<NonNullable<TDefinition['response']>['map']>
                  : never)
              | ('mapResponse' extends keyof TDefinition
                  ? ReturnType<NonNullable<TDefinition['mapResponse']>>
                  : never);
        readonly [apiOperationSchema]?: TPaths;
      }
    : never;
