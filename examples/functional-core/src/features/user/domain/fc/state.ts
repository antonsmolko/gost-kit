import { define, type AppError, type Nlx } from '@gost/common';
import type { User } from '../entities/user';

export type UserState = {
  readonly email: string;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly data: Nlx<User>;
  readonly errors: readonly AppError[];
};

export const userState = (options: Partial<UserState> = {}): UserState => {
  const createState = define.state<UserState>({
    email: '',
    status: 'idle',
    data: null,
    errors: [],
  });

  return createState(options);
};
