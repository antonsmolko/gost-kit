import { createContext } from 'svelte';
import { createModule } from './shell/module.svelte.ts';
import { createEffector } from './effector.ts';
import { initialState, reducer } from './reducer.ts';
import type { ApiClient } from './types.ts';

export const createRootStore = (api: ApiClient) => createModule({
  initState: initialState(), reducer, effector: createEffector(api),
});

export type RootStore = ReturnType<typeof createRootStore>;
export const [useRootStore, provideRootStore] = createContext<RootStore>();
export const useDispatch = () => useRootStore().dispatch;
