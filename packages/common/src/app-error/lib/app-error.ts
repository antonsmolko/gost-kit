import type { AppError } from '../types/app-error';

export const appError = (data: Partial<AppError> = {}): AppError => {
  return {
    code: '',
    message: '',
    path: [],
    ...data,
  }
}