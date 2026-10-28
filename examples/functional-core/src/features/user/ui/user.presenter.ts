import type { UserState } from '../domain/fc/state';

export const userPresenter = (state: UserState) => ({
  email: state.email,
  status: state.status,
  isLoading: state.status === 'loading',
  loadedUser: state.data,
});
