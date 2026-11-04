import type { AppError } from '../../app-error';

export type ApiFailure = {
  kind: 'http' | 'network' | 'aborted' | 'contract';
  status?: number;
  errors: AppError[];
};
