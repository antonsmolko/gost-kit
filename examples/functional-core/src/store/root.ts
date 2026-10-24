import type { RootStore } from './types/store.ts';
import { createStore } from '@gost/svelte';
import { createEffector } from './fc/effector.ts';
import { reducer } from './fc/reducer.ts';
import { initialState } from './fc/state.ts';
import type { ApiClient } from './types/effect.ts';
import { fakeApi } from '../fake-api.ts';
import { logReducer, logEffector } from '@gost/common';

export const createRootStore = (api: ApiClient) => createStore({
  initState: initialState(),
  reducer: logReducer(reducer, { isEnabled: true }),
  effector: logEffector(createEffector(api), { isEnabled: true }),
});

const root = createRootStore(fakeApi);

export const rootStore = (): RootStore => root;
