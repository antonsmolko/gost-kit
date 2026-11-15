import type { User } from '../entities/user';
import type { AppError } from '@gost-kit/common';

export type UserAction =
  | { type: 'SetEmailAction'; payload: { email: string } }
  | { type: 'LoadAction' }
  | { type: 'SuccessReceiveAction'; payload: { response: User } }
  | { type: 'ErrorReceiveAction'; payload: { errors: AppError[] } };
