import type { Dispatch } from './dispatch';
import type { Trigger } from './trigger';

export type Store<TState, TAction extends Trigger> = {
  readonly state: TState;
  dispatch: Dispatch<TAction>;
};
