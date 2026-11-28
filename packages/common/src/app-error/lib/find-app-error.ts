import type { Ulx } from '../../types';
import type { AppError } from '../types/app-error';

export const findAppError = (
  errors: readonly AppError[],
  path: AppError['path'],
): Ulx<AppError> => {
  return errors.find(({ path: errorPath }) => {
    return (
      errorPath.length === path.length &&
      path.every((segment, index) => {
        return segment === errorPath[index];
      })
    );
  });
};
