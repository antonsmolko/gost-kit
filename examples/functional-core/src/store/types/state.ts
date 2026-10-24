import type { Nlx } from '@gost/common';
import type { UserState } from '../../features/user/domain/fc/state.ts';

export type RootState = {
  readonly user: UserState;
  readonly alert: Nlx<{ readonly status: 'error'; readonly message: string }>;
};
