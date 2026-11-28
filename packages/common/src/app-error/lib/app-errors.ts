import type { Ulx } from '../../types';
import type { AppError } from '../types/app-error';
import {
  matchAppErrorPath,
  type AppErrorPathMatch,
} from './match-app-error-path';

type Params = {
  errors: readonly AppError[];
  path: AppError['path'];
  match?: AppErrorPathMatch;
};

export const appErrors = {
  get: ({ errors, path, match }: Params): AppError[] => {
    return errors.filter(matchAppErrorPath(path, match));
  },
  getOne: ({ errors, path, match }: Params): Ulx<AppError> => {
    return errors.find(matchAppErrorPath(path, match));
  },
  getMessages: (params: Params): string[] => {
    return appErrors.get(params).map(({ message }) => {
      return message;
    });
  },
  getMessage: (params: Params): Ulx<string> => {
    return appErrors.getOne(params)?.message;
  },
};
