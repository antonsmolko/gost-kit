import { expectTypeOf, test } from 'vitest';
import type { ActionsInScope } from './actions-in-scope';
import type { ScopedActions } from './scoped-actions';

test('selection by scope preserves the corresponding action variants and payloads', () => {
  type UserAction = { type: 'LoadAction'; page: number } | { type: 'SetEmailAction'; email: string };
  type RoleAction = { type: 'LoadAction'; roleId: string };
  type GlobalAction = { type: 'ShowAlertAction'; message: string };
  type Action = ScopedActions<{ users: UserAction; roles: RoleAction; root: GlobalAction }>;

  expectTypeOf<ActionsInScope<Action, 'users'>>().toEqualTypeOf<UserAction & { scope: 'users' }>();
  expectTypeOf<ActionsInScope<Action, 'roles'>>().toEqualTypeOf<RoleAction & { scope: 'roles' }>();
  expectTypeOf<ActionsInScope<Action, 'root'>>().toEqualTypeOf<GlobalAction & { scope?: 'root' }>();
  expectTypeOf<ActionsInScope<Action, 'missing'>>().toEqualTypeOf<never>();
  expectTypeOf<ActionsInScope<Action, 'users' | 'roles'>>().toEqualTypeOf<
    (UserAction & { scope: 'users' }) | (RoleAction & { scope: 'roles' })
  >();
  expectTypeOf<ActionsInScope<never, 'users'>>().toEqualTypeOf<never>();
});
