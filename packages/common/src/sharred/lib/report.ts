import type { AnyFn } from '../../types';

export const report = <TFailure>(
  failure: TFailure,
  onError: AnyFn<[failure: TFailure], void> = (failure) => console.error(failure),
): void => {
  try {
    onError(failure);
  } catch (error) {
    console.error('Error handler failed', { failure, error });
  }
};
