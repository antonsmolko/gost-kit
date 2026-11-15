import type { Trigger } from './trigger';
import type { DispatchPath } from './dispatch-path';
import type { ActionInput } from './action-input';

export type DispatchArguments<TAction extends Trigger> = TAction extends Trigger
  ? ActionInput<TAction> extends infer TInput
    ? 'payload' extends keyof TInput
      ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tests whether the normalized payload property is optional.
        {} extends Pick<TInput, 'payload'>
        ? [path: DispatchPath<TAction>, payload?: TInput['payload']]
        : [path: DispatchPath<TAction>, payload: TInput['payload']]
      : [path: DispatchPath<TAction>]
    : never
  : never;
