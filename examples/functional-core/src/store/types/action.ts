import type { UserAction } from '../../features/user/domain/fc/action.ts';

type ShowAlertAction = { type: 'ShowAlertAction'; status: 'error'; message: string };

export type RootAction = UserAction | ShowAlertAction;
