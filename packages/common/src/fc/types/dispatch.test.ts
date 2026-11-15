import { expect, test } from 'vitest';
import type { Dispatch } from './dispatch';
import type { ScopedActions } from './scoped-actions';
import { define } from '../lib/define';
import type { DispatchArguments } from './dispatch-arguments';
import type { DispatchAction } from './dispatch-action';

type Action = ScopedActions<{
  users:
    | { type: 'LoadAction' }
    | { type: 'PageAction'; payload: number }
    | { type: 'SearchAction'; payload: string }
    | { type: 'VisibleAction'; payload: boolean }
    | { type: 'SelectAction'; payload: string[] }
    | { type: 'ClearAction'; payload: null }
    | { type: 'EmailAction'; payload: { email: string } }
    | { type: 'OptionalAction'; payload?: number }
    | { type: 'FiltersAction'; payload: { active?: boolean } }
    | { type: 'UndefinedAction'; payload: undefined }
    | { type: 'MixedAction'; payload: string | number };
  roles: { type: 'PageAction'; payload: string };
  root: { type: 'RunAction' };
}>;

const checkDispatch = (dispatch: Dispatch<Action>) => {
  void dispatch('users/LoadAction');
  void dispatch('root/RunAction');
  void dispatch('roles/PageAction', 'admin');
  // @ts-expect-error Same action name has a different payload in this namespace.
  void dispatch('roles/PageAction', 2);
  void dispatch('users/PageAction', 2);
  void dispatch('users/SearchAction', 'Ada');
  void dispatch('users/VisibleAction', false);
  void dispatch('users/SelectAction', ['1', '2']);
  void dispatch('users/ClearAction', null);
  void dispatch('users/EmailAction', { email: 'ada@example.test' });
  void dispatch('users/OptionalAction');
  void dispatch('users/OptionalAction', 2);
  void dispatch('users/FiltersAction');
  void dispatch('users/FiltersAction', { active: true });
  void dispatch('users/UndefinedAction', undefined);
  void dispatch('users/MixedAction', 2);
  void dispatch('users/MixedAction', 'two');
  // @ts-expect-error Unknown namespace.
  void dispatch('roles/LoadAction');
  // @ts-expect-error Unknown action in this namespace.
  void dispatch('users/RunAction');
  // @ts-expect-error A required payload cannot be omitted.
  void dispatch('users/PageAction');
  // @ts-expect-error The selected action requires a number.
  void dispatch('users/PageAction', '2');
  // @ts-expect-error No payload is declared.
  void dispatch('users/LoadAction', 2);
  // @ts-expect-error Required undefined still requires an argument.
  void dispatch('users/UndefinedAction');
  // @ts-expect-error Old object dispatch is removed.
  void dispatch({ scope: 'users', type: 'LoadAction' });

  const path = Math.random() ? 'users/PageAction' : 'users/LoadAction';

  // @ts-expect-error A union path does not establish the matching payload.
  void dispatch(path, 2);

  const args: DispatchArguments<Action> = Math.random()
    ? ['users/PageAction', 2]
    : ['users/LoadAction'];

  void dispatch(...args);

  void dispatch({ action: 'users/LoadAction' });
  void dispatch({ action: 'users/PageAction', payload: 2 });
  void dispatch({ action: 'users/SelectAction', payload: ['1', '2'] });
  void dispatch({ action: 'users/OptionalAction' });
  void dispatch({ action: 'users/FiltersAction' });
  void dispatch({ action: 'users/UndefinedAction', payload: undefined });
  // @ts-expect-error Object calls preserve the selected payload type.
  void dispatch({ action: 'users/PageAction', payload: 'two' });
  // @ts-expect-error Required data is still required in the object form.
  void dispatch({ action: 'users/PageAction' });
  // @ts-expect-error An action without data does not accept payload.
  void dispatch({ action: 'users/LoadAction', payload: 2 });
  // @ts-expect-error Object calls preserve namespace/action pairing.
  void dispatch({ action: 'users/RunAction' });
  // @ts-expect-error Required undefined still needs a payload property.
  void dispatch({ action: 'users/UndefinedAction' });

  const saved: DispatchAction<Action> = Math.random()
    ? { action: 'users/PageAction', payload: 2 }
    : { action: 'users/LoadAction' };

  void dispatch(saved);

  const noData = { action: 'users/LoadAction' as const, payload: 2 };

  // @ts-expect-error Saved objects cannot add data to a no-data action.
  void dispatch(noData);

  // @ts-expect-error A dispatch object preserves the same no-data restriction.
  const invalidSaved: DispatchAction<Action> = noData;

  const selected: 'users/LoadAction' | 'users/PageAction' = Math.random()
    ? 'users/LoadAction'
    : 'users/PageAction';
  const uncorrelated = { action: selected, payload: 2 };

  // @ts-expect-error The saved path does not guarantee this payload is valid.
  void dispatch(uncorrelated);
  void invalidSaved;
};

const checkOptionalObject = () => {
  return define.reducer<
    boolean,
    { type: 'FiltersAction'; payload: { active?: boolean } }
  >()({
    FiltersAction: ({ action }) => {
      // @ts-expect-error Omitted optional object data may be undefined.
      void action.payload.active;

      return { state: action.payload?.active ?? false };
    },
  });
};

const checkShortNames = (
  dispatch: Dispatch<
    ScopedActions<{
      users: { type: 'setPage'; payload: number } | { type: 'load' };
    }>
  >,
) => {
  void dispatch('users/setPage', 2);
  void dispatch({ action: 'users/setPage', payload: 2 });
  void dispatch('users/load');
};

const checkInvalidDeclarations = (
  flat: Dispatch<{ type: 'SetAction'; count: number }>,
  paths: Dispatch<
    | { scope: ''; type: 'LoadAction' }
    | { scope: 'admin/users'; type: 'LoadAction' }
    | { scope: 'users'; type: 'Load/UserAction' }
  >,
) => {
  // @ts-expect-error Data must be declared in payload before it can be dispatched.
  void flat('root/SetAction');
  // @ts-expect-error The adapter must not silently discard action data.
  void flat({ action: 'root/SetAction', payload: 41 });
  // @ts-expect-error Empty namespace cannot produce a valid dispatch path.
  void paths('/LoadAction');
  // @ts-expect-error A namespace cannot include the path separator.
  void paths('admin/users/LoadAction');
  // @ts-expect-error An action name cannot include the path separator.
  void paths('users/Load/UserAction');
};

test('dispatch checks namespaced paths and their payloads', () => {
  expect(checkDispatch).toBeTypeOf('function');
  expect(checkOptionalObject).toBeTypeOf('function');
  expect(checkInvalidDeclarations).toBeTypeOf('function');
  expect(checkShortNames).toBeTypeOf('function');
});
