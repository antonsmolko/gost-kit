import type { Ulx } from '../../types';
import type { AppError } from '../types/app-error';
import { matchAppErrorPath } from './match-app-error-path';

export const findAppError = (
  errors: readonly AppError[],
  path: AppError['path'],
): Ulx<AppError> => {
  return errors.find(matchAppErrorPath(path));
};
