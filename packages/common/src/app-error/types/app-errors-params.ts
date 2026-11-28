import type { AppError } from './app-error';
import type { AppErrorPathMatch } from './app-error-path-match';

export type AppErrorsParams = {
  errors: readonly AppError[];
  path: AppError['path'];
  match?: AppErrorPathMatch;
};
