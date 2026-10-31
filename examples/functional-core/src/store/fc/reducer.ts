import { define, reducing, scope, type ActionsInScope, type Reducer } from '@gost-kit/common';
import type { RootAction } from '../types/action';
import type { RootEffect } from '../types/effect';
import type { RootState } from '../types/state';
import { userReducer } from '../../features/user/domain/fc/reducer';

const appReducer = define.reducer<RootState, ActionsInScope<RootAction, 'root'>, RootEffect>()({
  ShowAlertAction: ({ state, action }) => ({
    state: { ...state, alert: { status: action.status, message: action.message } },
  }),
});

export const reducer: Reducer<RootState, RootAction, RootEffect> = reducing({
  users: scope('user', userReducer),
  root: appReducer,
});
