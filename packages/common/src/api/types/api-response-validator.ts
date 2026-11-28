import type { AppError } from '../../app-error';

export type ApiResponseValidator = (dto: unknown) => AppError[];
