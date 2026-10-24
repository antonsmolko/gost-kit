import { userState } from '../../features/user/domain/fc/state.ts';
import type { RootState } from '../types/state.ts';

export const initialState = (): RootState => ({ user: userState(), alert: null });
