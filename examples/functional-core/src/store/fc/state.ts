import { userState } from '../../features/user/domain/fc/state';
import type { RootState } from '../types/state';

export const initialState = (): RootState => ({ user: userState(), alert: null });
