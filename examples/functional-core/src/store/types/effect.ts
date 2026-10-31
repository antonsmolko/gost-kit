import type { AppError, AsyncFn } from '@gost-kit/common';
import type { User } from '../../features/user/domain/entities/user';
import type { RootAction } from './action';

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
