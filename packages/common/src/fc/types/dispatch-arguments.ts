import type { Trigger } from './trigger';
import type { DispatchPath } from './dispatch-path';

export type DispatchArguments<TAction extends Trigger> = TAction extends Trigger
  ? 'payload' extends keyof TAction
    ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tests whether the payload property is optional.
      {} extends Pick<TAction, 'payload'>
      ? [path: DispatchPath<TAction>, payload?: TAction['payload']]
      : [TAction['payload']] extends [object]
        ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tests whether an object payload has no required fields.
          {} extends TAction['payload']
          ? [path: DispatchPath<TAction>, payload?: TAction['payload']]
          : [path: DispatchPath<TAction>, payload: TAction['payload']]
        : [path: DispatchPath<TAction>, payload: TAction['payload']]
    : [path: DispatchPath<TAction>]
  : never;
