import { expectTypeOf, test } from 'vitest';
import type { Dispatch } from './dispatch';
import type { ScopedActions } from './scoped-actions';

type UserAction = { type: 'LoadAction'; page: number };
type RoleAction = { type: 'LoadAction'; roleId: string };
type GlobalAction = { type: 'LoadAction'; reason: string };
type Action = ScopedActions<{ users: UserAction; roles: RoleAction; root: GlobalAction }>;
type Input = Parameters<Dispatch<Action>>[0];

test('dispatch accepts the matching scoped payload and defaults omitted scope only to root', () => {
  expectTypeOf<UserAction & { scope: 'users' }>().toExtend<Input>();
  expectTypeOf<RoleAction & { scope: 'roles' }>().toExtend<Input>();
  expectTypeOf<GlobalAction>().toExtend<Input>();
  expectTypeOf<{ scope: 'root'; type: 'LoadAction'; reason: string }>().toExtend<Input>();

  expectTypeOf<{ scope: 'users'; type: 'LoadAction'; roleId: string }>().not.toExtend<Input>();
  expectTypeOf<{ scope: 'roles'; type: 'LoadAction'; page: number }>().not.toExtend<Input>();
  expectTypeOf<{ scope: 'missing'; type: 'LoadAction'; reason: string }>().not.toExtend<Input>();
  expectTypeOf<{ scope: 'users'; type: 'LoadAction' }>().not.toExtend<Input>();
  expectTypeOf<{ type: 'LoadAction'; page: number }>().not.toExtend<Input>();
  expectTypeOf<{ scope: 'users'; type: 'LoadAction'; page: string }>().not.toExtend<Input>();
});
