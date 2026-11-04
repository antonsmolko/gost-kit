import type { ApiFailure } from './api-failure';

export type ApiResult<TData> =
  | { type: 'ok'; data: TData }
  | { type: 'error'; error: ApiFailure };
