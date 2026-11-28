import type { Ulx } from '../../types';
import type { AppError } from '../types/app-error';
import type { AppErrorsParams } from '../types/app-errors-params';
import { matchAppErrorPath } from './match-app-error-path';

export const appErrors = {
  get: ({ errors, path, match }: AppErrorsParams): AppError[] => {
    return errors.filter(matchAppErrorPath(path, match));
  },
  getOne: ({ errors, path, match }: AppErrorsParams): Ulx<AppError> => {
    return errors.find(matchAppErrorPath(path, match));
  },
  getMessages: (params: AppErrorsParams): string[] => {
    return appErrors.get(params).map(({ message }) => {
      return message;
    });
  },
  getMessage: (params: AppErrorsParams): Ulx<string> => {
    return appErrors.getOne(params)?.message;
  },
};
