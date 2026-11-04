import { guard } from '../../sharred';
import { ErrorName } from '../enums/error-name';
import type { Nlx } from '../../types';
import type { ApiFailure } from '../types/api-failure';

export const normalizeError = (
  error: unknown,
  signal?: Nlx<AbortSignal>,
): ApiFailure => {
  const isAborted = signal?.aborted
    || (
      guard.record(error)
      && (error.name === ErrorName.Abort || error.name === ErrorName.Timeout)
    );

  if (isAborted) {
    return {
      kind: 'aborted',
      errors: [],
    };
  }

  return {
    kind: error instanceof SyntaxError ? 'contract' : 'network',
    errors: [],
  };
};
