import type { ApiResponseValidator } from './api-response-validator';

export type ApiResponsePipeline<TDto, TData> = {
  readonly validate: ApiResponseValidator;
  readonly map: (dto: TDto) => TData;
};
