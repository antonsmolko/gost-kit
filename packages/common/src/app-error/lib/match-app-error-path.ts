import type { AppError } from '../types/app-error';

export type AppErrorPathMatch = 'exact' | 'prefix';

export const matchAppErrorPath = (
  path: AppError['path'],
  match: AppErrorPathMatch = 'exact',
) => {
  return ({ path: errorPath }: AppError): boolean => {
    const matchesLength =
      match === 'exact'
        ? errorPath.length === path.length
        : errorPath.length >= path.length;

    return (
      matchesLength &&
      path.every((segment, index) => {
        return segment === errorPath[index];
      })
    );
  };
};
