import { expectTypeOf, test } from 'vitest';
import type { Dispatch } from './dispatch';
import type { ScopedActions } from './scoped-actions';

type UserAction = { type: 'LoadAction'; page: number } | { type: 'SetEmailAction'; email: string };
type RoleAction = { type: 'LoadAction'; roleId: string };
type GlobalAction = { type: 'ShowAlertAction'; message: string };
type Action = ScopedActions<{ users: UserAction; roles: RoleAction; root: GlobalAction }>;

test('scope is added from the map key while preserving local action variants and payloads', () => {
  expectTypeOf<Extract<Action, { scope: 'users' }>>().toEqualTypeOf<UserAction & { scope: 'users' }>();
  expectTypeOf<Extract<Action, { scope: 'roles' }>>().toEqualTypeOf<RoleAction & { scope: 'roles' }>();
  expectTypeOf<UserAction>().not.toExtend<Parameters<Dispatch<ScopedActions<{ users: UserAction }>>>[0]>();
  expectTypeOf<ScopedActions<{}>>().toEqualTypeOf<never>();
});

test('root actions accept omitted or explicit root scope without declaring it locally', () => {
  type Root = Exclude<Action, { scope: string }>;

  expectTypeOf<Root>().toEqualTypeOf<GlobalAction & { scope?: 'root' }>();
  expectTypeOf<GlobalAction>().toExtend<Action>();
  expectTypeOf<{ scope: 'root'; type: 'ShowAlertAction'; message: string }>().toExtend<Action>();
  expectTypeOf<{ scope: 'users'; type: 'ShowAlertAction'; message: string }>().not.toExtend<Action>();
});

test('changing a map key changes the allowed scope without changing local action declarations', () => {
  type Action = ScopedActions<{ people: UserAction }>;

  expectTypeOf<UserAction & { scope: 'people' }>().toExtend<Action>();
  expectTypeOf<UserAction & { scope: 'users' }>().not.toExtend<Action>();
});

test('local action declarations cannot define their own scope', () => {
  // @ts-expect-error Scope is reserved for the namespace supplied by the map.
  type PayloadScope = ScopedActions<{ users: { type: 'PickAction'; scope: 'all' | 'mine' } }>;
  // @ts-expect-error A matching namespace must also be declared only in the map.
  type MatchingScope = ScopedActions<{ users: UserAction & { scope: 'users' } }>;
  // @ts-expect-error Optional feature scopes are not local payload fields either.
  type OptionalScope = ScopedActions<{ users: UserAction & { scope?: 'users' } }>;
  // @ts-expect-error Root scope is added by ScopedActions, not declared locally.
  type RootScope = ScopedActions<{ root: GlobalAction & { scope?: 'root' } }>;
  // @ts-expect-error Every variant of the local union must be unscoped.
  type MixedScope = ScopedActions<{ users: UserAction | { type: 'PickAction'; scope: 'mine' } }>;
});
