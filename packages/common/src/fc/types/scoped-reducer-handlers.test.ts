import { expect, expectTypeOf, test } from 'vitest';
import type { ScopedReducerHandlers } from './scoped-reducer-handlers';
import type { ScopedActions } from './scoped-actions';

type State = { count: number };
type UserAction = { type: 'LoadAction'; page: number };
type RoleAction = { type: 'LoadAction'; roleId: string };
type GlobalAction = { type: 'ShowAlertAction'; message: string };
type Action = ScopedActions<{ users: UserAction; roles: RoleAction; root: GlobalAction }>;

test('equal action names in different scopes retain their own payload types', () => {
  const handlers: ScopedReducerHandlers<State, Action, never> = {
    users: {
      LoadAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<UserAction & { scope: 'users' }>();
        return { state: { count: action.page } };
      },
    },
    roles: {
      LoadAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<RoleAction & { scope: 'roles' }>();
        return { state: { count: action.roleId.length } };
      },
    },
    root: {
      ShowAlertAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<GlobalAction & { scope?: 'root' }>();
        return { state: { count: action.message.length } };
      },
    },
  };
  const state: State = { count: 0 };

  expect(handlers.users.LoadAction({ state, action: { scope: 'users', type: 'LoadAction', page: 7 } }, state)?.state).toEqual({ count: 7 });
  expect(handlers.roles.LoadAction({ state, action: { scope: 'roles', type: 'LoadAction', roleId: 'admin' } }, state)?.state).toEqual({ count: 5 });
  expect(handlers.root.ShowAlertAction({ state, action: { type: 'ShowAlertAction', message: 'Failed' } }, state)?.state).toEqual({ count: 6 });

  // @ts-expect-error The roles namespace is missing.
  const missingScope: ScopedReducerHandlers<State, Action, never> = { users: handlers.users, root: handlers.root };
  const missingHandler: ScopedReducerHandlers<State, Action, never> = {
    ...handlers,
    // @ts-expect-error Every declared action needs its handler.
    users: {},
  };
  const foreignHandler: ScopedReducerHandlers<State, Action, never> = {
    ...handlers,
    // @ts-expect-error A roles handler cannot receive the users payload.
    users: handlers.roles,
  };
  const optional: Partial<typeof handlers.users> = handlers.users;
  const optionalHandler: ScopedReducerHandlers<State, Action, never> = {
    ...handlers,
    // @ts-expect-error An optional handler does not guarantee coverage.
    users: optional,
  };
  const undefinedHandler: ScopedReducerHandlers<State, Action, never> = {
    ...handlers,
    // @ts-expect-error A handler cannot be undefined.
    users: { LoadAction: undefined },
  };
  const unknownScope: ScopedReducerHandlers<State, Action, never> = {
    ...handlers,
    // @ts-expect-error This namespace is not declared in the action union.
    missing: handlers.users,
  };
  void [missingScope, missingHandler, foreignHandler, optionalHandler, undefinedHandler, unknownScope];
});
