import { define, reducing, type Reducer } from '@gost/common';
import type { RootAction } from '../types/action.ts';
import type { RootEffect } from '../types/effect.ts';
import type { RootState } from '../types/state.ts';
import { userReducer } from '../../features/user/domain/fc/reducer.ts';
import type { UserAction } from '../../features/user/domain/fc/action.ts';

const appReducer = define.reducer<RootState, Exclude<RootAction, UserAction>, RootEffect>({
  ShowAlertAction: ({ state, action }) => ({
    state: { ...state, alert: { status: action.status, message: action.message } },
  }),
});

export const reducer: Reducer<RootState, RootAction, RootEffect> = reducing(userReducer, appReducer);
