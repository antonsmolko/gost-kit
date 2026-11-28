import type { Ulx } from '../../types';
import type { AppError } from '../types/app-error';
import { findAppError } from './find-app-error';

export const findAppErrorMessage = (
  errors: readonly AppError[],
  path: AppError['path'],
): Ulx<string> => {
  return findAppError(errors, path)?.message;
};
