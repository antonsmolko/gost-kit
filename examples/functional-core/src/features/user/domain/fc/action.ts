import type { User } from '../entities/user';
import type { AppError } from '@gost/common';

export type UserAction =
  | { type: 'SetEmailAction'; email: string }
  | { type: 'LoadAction' }
  | { type: 'SuccessReceiveAction'; response: User }
  | { type: 'ErrorReceiveAction'; errors: AppError[] };
