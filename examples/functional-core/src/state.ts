import type { RootState, UserState } from './types.ts';
export const userState = (data: Partial<UserState> = {}): UserState => ({
  email: '', status: 'idle', data: null, errors: [], ...data,
});
export const initialState = (): RootState => ({ user: userState(), alert: null });
