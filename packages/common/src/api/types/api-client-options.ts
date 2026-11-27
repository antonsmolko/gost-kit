import type { ClientOptions } from 'openapi-fetch';
import type { AppError } from '../../app-error';
import type { ApiFailure } from './api-failure';

export type ApiClientOptions = Omit<ClientOptions, 'baseUrl'> & {
  baseUrl: string;
  mapErrors?: (body: unknown, response: Response) => AppError[];
  onFailure?: (failure: ApiFailure) => void;
};
