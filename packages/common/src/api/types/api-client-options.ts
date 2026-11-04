import type { ClientOptions } from 'openapi-fetch';
import type { AppError } from '../../app-error';

export type ApiClientOptions = Omit<ClientOptions, 'baseUrl'> & {
  baseUrl: string;
  mapErrors?: (body: unknown, response: Response) => AppError[];
};
