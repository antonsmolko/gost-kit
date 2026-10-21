export type User = { readonly id: string; readonly name: string; readonly email: string };
export type AppError = {
  readonly code: string;
  readonly message: string;
  readonly path: readonly string[];
};

export type UserAction =
  | { type: 'UserSetEmailAction'; email: string }
  | { type: 'UserLoadAction' }
  | { type: 'UserSuccessReceiveAction'; response: User }
  | { type: 'UserErrorReceiveAction'; errors: AppError[] };

export type GlobalAction =
  | { type: 'ShowAlertAction'; status: 'error'; message: string }
  | { type: 'DismissAlertAction' };

export type RootAction = UserAction | GlobalAction;
export type UserState = {
  readonly email: string;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly data: User | null;
  readonly errors: readonly AppError[];
};
export type RootState = {
  readonly user: UserState;
  readonly alert: { readonly status: 'error'; readonly message: string } | null;
};

// One concrete request is enough to demonstrate the execution contract.
export type ApiEffect = {
  type: 'ApiEffect';
  url: '/user';
  body: { email: string };
  receiverSuccess: (response: User) => RootAction;
  defaultError: AppError;
  receiverError: (errors: AppError[]) => RootAction;
};
export type DispatchActionEffect = { type: 'DispatchActionEffect'; action: RootAction };
export type RootEffect = ApiEffect | DispatchActionEffect;
export type ApiClient = (request: Pick<ApiEffect, 'url' | 'body'>) => Promise<User>;
