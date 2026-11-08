import type { Dispatch } from './dispatch';
import type { Trigger } from './trigger';
import type { Reset } from './reset';

export type Store<TState, TAction extends Trigger> = {
  readonly state: TState;
  dispatch: Dispatch<TAction>;
  reset: Reset<TState>;
};
