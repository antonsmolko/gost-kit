import { expect, expectTypeOf, test } from 'vitest';
import type { StoreError } from './store-error';
import type { ResetError } from './reset-error';

type Action = { type: 'RunAction'; value: number };
type Effect = { type: 'RunEffect'; id: string };

const checkFailure = (failure: StoreError<Action, Effect>) => {
  if (failure.kind === 'reset') {
    expectTypeOf(failure).toEqualTypeOf<ResetError>();
    // @ts-expect-error Reset errors have no action.
    void failure.action;

    return;
  }

  expectTypeOf(failure.action).toEqualTypeOf<Action>();

  if (failure.kind === 'effect') {
    expectTypeOf(failure.effect).toEqualTypeOf<Effect>();
  }
};

test('checks reset and dispatch failure discrimination without executing the handler', () => {
  expect(checkFailure).toBeTypeOf('function');
});
