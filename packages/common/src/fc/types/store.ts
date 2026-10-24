import type { Dispatch } from './dispatch.ts';
import type { Trigger } from './trigger.ts';

export type Store<TState, TAction extends Trigger> = {
  readonly state: TState;
  dispatch: Dispatch<TAction>;
};
