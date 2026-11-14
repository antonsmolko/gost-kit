import { expect, test } from 'vitest';
import type { Dispatch } from './dispatch';
import type { ScopedActions } from './scoped-actions';
import { define } from '../lib/define';

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

test('dispatch checks namespaced paths and their payloads', () => {
  expect(checkDispatch).toBeTypeOf('function');
  expect(checkOptionalObject).toBeTypeOf('function');
});
