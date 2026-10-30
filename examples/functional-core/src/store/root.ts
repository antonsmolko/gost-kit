import type { RootStore } from './types/store';
import { createStore } from '@gost/svelte';
import { createEffector } from './fc/effector';
import { reducer } from './fc/reducer';
import { initialState } from './fc/state';
import type { ApiClient } from './types/effect';
import { fakeApi } from '../fake-api';
import { logReducer, logEffector, report } from '@gost/common';

const loggedReducer = logReducer(reducer, { isEnabled: true });

export const createRootStore = (api: ApiClient) => createStore({
  initState: initialState(),
  reducer: loggedReducer,
  effector: logEffector(createEffector(api), { isEnabled: true }),
  onError: (failure) => { report(failure); },
});

const root = createRootStore(fakeApi);

export const rootStore = (): RootStore => root;
