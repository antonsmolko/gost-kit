import type { RootStore } from './types/store';
import { createStore } from '@gost/svelte';
import { createEffector } from './fc/effector';
import { reducer } from './fc/reducer';
import { initialState } from './fc/state';
import type { ApiClient } from './types/effect';
import { fakeApi } from '../fake-api';
import { logReducer, logEffector } from '@gost/common';

export const createRootStore = (api: ApiClient) => createStore({
  initState: initialState(),
  reducer: logReducer(reducer, { isEnabled: true }),
  effector: logEffector(createEffector(api), { isEnabled: true }),
});

const root = createRootStore(fakeApi);

export const rootStore = (): RootStore => root;
