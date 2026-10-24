import type { AppError, AsyncFn } from '@gost/common';
import type { User } from '../../features/user/domain/entities/user.ts';
import type { RootAction } from './action.ts';

export type DispatchActionEffect = { type: 'DispatchActionEffect'; action: RootAction };

export type ApiEffect = {
  type: 'ApiEffect';
  url: '/user';
  body: { email: string };
  receiverSuccess: (response: User) => RootAction;
  defaultError: AppError;
  receiverError: (errors: AppError[]) => RootAction;
};

export type RootEffect = ApiEffect | DispatchActionEffect;

export type ApiClient = AsyncFn<[request: Pick<ApiEffect, 'url' | 'body'>], User>;
