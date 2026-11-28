import type { ApiResponsePipeline } from '../types/api-response-pipeline';
import type { ApiResponseValidator } from '../types/api-response-validator';

export const response = {
  validate: (validate: ApiResponseValidator) => {
    return {
      map: <TDto, TData>(
        map: (dto: TDto) => TData,
      ): ApiResponsePipeline<TDto, TData> => {
        return { validate, map };
      },
    };
  },
};
