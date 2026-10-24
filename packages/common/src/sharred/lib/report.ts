import type { AnyFn } from '../../types/any-fn.ts';
import type { Vdx } from '../../types/vdx.ts';

export const report = async <TFailure>(
  failure: TFailure,
  onError: AnyFn<[failure: TFailure], Vdx<Promise<void>>> = (failure) => console.error(failure),
): Promise<void> => {
  try {
    await onError(failure);
  } catch (error) {
    console.error('Error handler failed', { failure, error });
  }
};
