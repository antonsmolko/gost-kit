import type { User } from '../entities/user.ts';
import type { AppError } from '@gost/common';

export type UserAction =
  | { type: 'UserSetEmailAction'; email: string }
  | { type: 'UserLoadAction' }
  | { type: 'UserSuccessReceiveAction'; response: User }
  | { type: 'UserErrorReceiveAction'; errors: AppError[] };
