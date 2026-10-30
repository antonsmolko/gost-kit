import type { Result } from '../../types';
import { guard } from './guard';

export const toErrorResult = (error: unknown): Extract<Result, { type: 'error' }> => ({
  type: 'error',
  error: guard.error(error) ? error : new Error('Operation failed', { cause: error }),
});
