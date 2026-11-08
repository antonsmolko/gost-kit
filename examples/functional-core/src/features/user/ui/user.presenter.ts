import { guard } from '@gost-kit/common';
import type { UserState } from '../domain/fc/state';

type UserViewState = {
  email: string;
  status: UserState['status'];
  isLoading: boolean;
  loadedUser: UserState['data'];
  hasLoadedUser: boolean;
  loadedUserName: string;
  loadedUserEmail: string;
};

export const userPresenter = ({
  state,
}: {
  state: UserState;
}): UserViewState => {
  return {
    email: state.email,
    status: state.status,
    isLoading: state.status === 'loading',
    loadedUser: state.data,
    hasLoadedUser: !guard.nlx(state.data),
    loadedUserName: state.data?.name ?? '',
    loadedUserEmail: state.data?.email ?? '',
  };
};
