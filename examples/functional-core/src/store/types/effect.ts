import type {
  ApiClient as CommonApiClient,
  ApiEffect as CommonApiEffect,
} from '@gost-kit/common';
import type { loadUser } from '../../features/user/data/api/load-user';
import type { Paths } from '../../api/paths';
import type { RootAction } from './action';

export type DispatchActionEffect = {
  type: 'DispatchActionEffect';
  action: RootAction;
};
export type ApiOperations = typeof loadUser;
export type ApiEffect = CommonApiEffect<Paths, RootAction, ApiOperations>;
export type RootEffect = ApiEffect | DispatchActionEffect;
export type ApiClient = CommonApiClient<Paths>;
