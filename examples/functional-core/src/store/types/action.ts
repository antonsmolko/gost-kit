import type { ScopedActions } from '@gost/common';
import type { UserAction } from '../../features/user/domain/fc/action';

type ShowAlertAction = { type: 'ShowAlertAction'; status: 'error'; message: string };

export type RootAction = ScopedActions<{
  users: UserAction;
  root: ShowAlertAction;
}>;
