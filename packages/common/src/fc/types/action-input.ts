import type { Trigger } from './trigger';

/** Reflects payload omission permitted by Dispatch in reducer inputs. */
export type ActionInput<TAction extends Trigger> = TAction extends {
  payload: infer TPayload;
}
  ? [TPayload] extends [object]
    ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- An empty shape identifies an object with no required fields.
      {} extends TPayload
      ? Omit<TAction, 'payload'> & { payload?: TPayload }
      : TAction
    : TAction
  : TAction;
