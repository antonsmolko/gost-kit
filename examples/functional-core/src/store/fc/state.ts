import { userState } from '../../features/user/domain/fc/state';
import type { RootState } from '../types/state';
import { define } from '@gost-kit/common';

export const initialState = define.state<RootState>((options = {}) => {
  return {
    user: userState(),
    alert: null,
    ...options,
  };
});
