import type { StoreConfig } from './store-config';
import type { Trigger } from './trigger';

export type DispatchConfig<TState, TAction extends Trigger, TEffect extends Trigger> = Omit<StoreConfig<TState, TAction, TEffect>, 'initState'> & {
  readState: () => TState;
  writeState: (state: TState) => void;
};
