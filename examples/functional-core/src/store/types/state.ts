import type { Nlx } from '@gost-kit/common';
import type { UserState } from '../../features/user/domain/fc/state';

export type RootState = {
  readonly user: UserState;
  readonly alert: Nlx<{ readonly status: 'error'; readonly message: string }>;
};
