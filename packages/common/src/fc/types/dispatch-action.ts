import type { Trigger } from './trigger';
import type { DispatchPath } from './dispatch-path';
import type { ActionInput } from './action-input';

/**
 * Object call accepted by dispatch and returned by API callbacks.
 * Payload requirements are shared with string calls and reducer inputs.
 */
export type DispatchAction<TAction extends Trigger> = TAction extends Trigger
  ? { action: DispatchPath<TAction> } & ('payload' extends keyof TAction
      ? Pick<
          ActionInput<TAction>,
          Extract<keyof ActionInput<TAction>, 'payload'>
        >
      : { payload?: never })
  : never;
