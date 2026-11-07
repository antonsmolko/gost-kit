import type { FetchOptions } from 'openapi-fetch';
import type { FilterKeys } from 'openapi-typescript-helpers';
import type { ApiOperation } from './api-operation';
import type { apiOperationSchema } from './api-operation-schema';

export type ApiOperationOptions<TOperation extends ApiOperation> =
  TOperation extends ApiOperation
    ? NonNullable<TOperation[typeof apiOperationSchema]> extends infer TPaths
      ? TOperation['url'] extends keyof TPaths
        ? Omit<
            FetchOptions<
              FilterKeys<TPaths[TOperation['url']], TOperation['method']>
            >,
            'method' | 'parseAs'
          > & {
            parseAs?: 'json';
          }
        : never
      : never
    : never;
