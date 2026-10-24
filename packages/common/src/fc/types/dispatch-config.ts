import type { StoreConfig } from './store-config.ts';
import type { Trigger } from './trigger.ts';

export type DispatchConfig<TState, TAction extends Trigger, TEffect extends Trigger> = Omit<StoreConfig<TState, TAction, TEffect>, 'initState'> & {
  readState: () => TState;
  writeState: (state: TState) => void;
};
