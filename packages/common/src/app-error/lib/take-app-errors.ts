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

export const takeAppErrors = {
  at: ({ errors, path, match }: Params): AppError[] => {
    return errors.filter(matchAppErrorPath(path, match));
  },
  messages: (params: Params): string[] => {
    return takeAppErrors.at(params).map(({ message }) => {
      return message;
    });
  },
};
