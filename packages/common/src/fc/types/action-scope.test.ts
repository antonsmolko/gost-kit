import { expectTypeOf, test } from 'vitest';
import type { ActionScope } from './action-scope';
import type { ScopedActions } from './scoped-actions';

test('action namespaces come from required scopes and default to root', () => {
  type Action = ScopedActions<{
    users: { type: 'LoadAction' };
    roles: { type: 'LoadAction' };
    root: { type: 'ShowAlertAction' };
  }>;

  expectTypeOf<ActionScope<Action>>().toEqualTypeOf<'users' | 'roles' | 'root'>();
  expectTypeOf<ActionScope<{ type: 'ShowAlertAction' }>>().toEqualTypeOf<'root'>();
  expectTypeOf<ActionScope<{ type: 'ShowAlertAction'; scope: 'root' }>>().toEqualTypeOf<'root'>();
  expectTypeOf<ActionScope<never>>().toEqualTypeOf<never>();
});
