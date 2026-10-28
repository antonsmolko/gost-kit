import { expect, expectTypeOf, test } from 'vitest';
import { define } from './define';
import { reducing } from './reducing';
import { scope } from './scope';
import type { ActionsInScope } from '../types/actions-in-scope';
import type { Reducer } from '../types/reducer';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { ScopedActions } from '../types/scoped-actions';

type State = { count: number; previous?: boolean };
type Action = { type: 'SetAction'; count: number } | { type: 'IdleAction' };
type Effect = { type: 'RecordEffect'; value: number } | { type: 'OtherEffect' };

test('reducing composes root handlers and routes the narrowed action payload', () => {
  const feature = define.reducer<State, Extract<Action, { type: 'SetAction' }>, Effect>()({
    SetAction: ({ action }) => ({ state: { count: action.count } }),
  });
  const other = define.reducer<State, Extract<Action, { type: 'IdleAction' }>, Effect>()({
    IdleAction: ({ state }) => ({ state }),
  });
  const reducer: Reducer<State, Action, Effect> = reducing({ root: { ...feature, ...other } });
  expect(reducer({ count: 0, previous: true }, { type: 'SetAction', count: 7 })).toEqual({
    state: { count: 7 }, effects: [],
  });
  const state = { count: 7 };
  expect(reducer(state, { type: 'IdleAction' }).state).toBe(state);
});

test('an empty handler result keeps state and yields no effects', () => {
  const reducer: Reducer<State, Extract<Action, { type: 'IdleAction' }>, Effect> = reducing({ root: { IdleAction: () => {} } });
  const state = { count: 0 };
  expect(reducer(state, { type: 'IdleAction' })).toEqual({ state, effects: [] });
});

test('a handler can return the readonly input unchanged, including mutable array fields', () => {
  type ListState = { items: string[] };
  const handlers = define.reducer<ListState, Extract<Action, { type: 'IdleAction' }>>()({
    IdleAction: ({ state }) => ({ state }),
  });
  const reducer: Reducer<ListState, Extract<Action, { type: 'IdleAction' }>, never> = reducing({ root: handlers });
  const state: ListState = { items: ['first'] };
  expect(reducer(state, { type: 'IdleAction' }).state).toBe(state);
});

test('effects-only results preserve state and normalize a single effect to an array', () => {
  const reducer: Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect> = reducing({
    root: { SetAction: ({ action }) => ({ effects: { type: 'RecordEffect', value: action.count } }) },
  });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({
    state, effects: [{ type: 'RecordEffect', value: 7 }],
  });
});

test('an effects array passes through without changing its reference', () => {
  const effects: Effect[] = [{ type: 'RecordEffect', value: 7 }, { type: 'OtherEffect' }];
  const reducer: Reducer<State, Extract<Action, { type: 'IdleAction' }>, Effect> = reducing({
    root: { IdleAction: () => ({ effects }) },
  });
  expect(reducer({ count: 0 }, { type: 'IdleAction' }).effects).toBe(effects);
});

test('equal action names select their own namespace and retain distinct payloads', () => {
  type ScopedAction = ScopedActions<{
    users: { type: 'LoadAction'; page: number };
    roles: { type: 'LoadAction'; roleId: string };
    root: { type: 'LoadAction'; reason: string };
  }>;
  const received: ScopedAction[] = [];
  const reducer: Reducer<State, ScopedAction, Effect> = reducing({
    users: {
      LoadAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<ActionsInScope<ScopedAction, 'users'>>();
        received.push(action);
        return { state: { count: action.page } };
      },
    },
    roles: {
      LoadAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<ActionsInScope<ScopedAction, 'roles'>>();
        received.push(action);
        return { state: { count: action.roleId.length } };
      },
    },
    root: {
      LoadAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<ActionsInScope<ScopedAction, 'root'>>();
        received.push(action);
        return { state: { count: action.reason.length } };
      },
    },
  });
  const state = { count: 0 };
  const actions: ScopedAction[] = [
    { scope: 'users', type: 'LoadAction', page: 7 },
    { scope: 'roles', type: 'LoadAction', roleId: 'admin' },
    { type: 'LoadAction', reason: 'refresh' },
    { scope: 'root', type: 'LoadAction', reason: 'again' },
  ];
  expect(actions.map((action) => reducer(state, action).state.count)).toEqual([7, 5, 7, 5]);
  actions.forEach((action, index) => expect(received[index]).toBe(action));
  expect(received[2]).not.toHaveProperty('scope');

  expectTypeOf<{ scope: 'users'; type: 'LoadAction'; roleId: string }>().not.toExtend<Parameters<typeof reducer>[1]>();
  expectTypeOf<{ type: 'LoadAction'; page: number }>().not.toExtend<Parameters<typeof reducer>[1]>();
});

test('the action namespace is independent of its state key', () => {
  type FeatureState = { name: string };
  type RootState = { user: FeatureState; alert: string };
  type UserAction = { type: 'SetAction'; name: string };
  type RootAction = ScopedActions<{ users: UserAction }>;
  const handlers = define.reducer<FeatureState, UserAction, Effect, RootState>()({
    SetAction: ({ action }, rootState) => ({
      state: { name: `${rootState.alert}: ${action.name}` },
      effects: { type: 'RecordEffect', value: action.name.length },
    }),
  });
  const reducer: Reducer<RootState, RootAction, Effect> = reducing({ users: scope('user', handlers) });
  const state: RootState = { user: { name: '' }, alert: 'hello' };
  const commit = reducer(state, { scope: 'users', type: 'SetAction', name: 'Ada' });

  expect(commit).toEqual({
    state: { user: { name: 'hello: Ada' }, alert: 'hello' },
    effects: [{ type: 'RecordEffect', value: 3 }],
  });
  expect(state.user.name).toBe('');
});

test('requires complete non-optional handler coverage in every namespace', () => {
  type ScopedAction = ScopedActions<{ users: Action; root: { type: 'ResetAction' } }>;
  const users = define.reducer<State, Action, Effect>()({
    SetAction: ({ action }) => ({ state: { count: action.count } }),
    IdleAction: () => {},
  });
  const root = define.reducer<State, { type: 'ResetAction' }, Effect>()({ ResetAction: () => ({ state: { count: 0 } }) });

  // @ts-expect-error The root namespace is missing.
  const missingScope: Reducer<State, ScopedAction, Effect> = reducing({ users });
  // @ts-expect-error IdleAction is missing in the users namespace.
  const missingAction: Reducer<State, ScopedAction, Effect> = reducing({ users: { SetAction: users.SetAction }, root });
  const optional: Partial<ReducerHandlers<State, Action, Effect>> = users;
  // @ts-expect-error Optional handlers cannot guarantee coverage.
  const optionalHandler: Reducer<State, ScopedAction, Effect> = reducing({ users: optional, root });
  // @ts-expect-error A possibly undefined handler cannot guarantee coverage.
  const undefinedHandler: Reducer<State, ScopedAction, Effect> = reducing({ users: { ...users, SetAction: undefined }, root });
  const chooseUsers = (first: boolean) => first ? users : { SetAction: users.SetAction };
  // @ts-expect-error Every table alternative must cover the namespace.
  const tableUnion: Reducer<State, ScopedAction, Effect> = reducing({ users: chooseUsers(true), root });
  const chooseMap = (first: boolean) => first ? { users, root } : { users };
  // @ts-expect-error Every namespace-map alternative must be complete.
  const mapUnion: Reducer<State, ScopedAction, Effect> = reducing(chooseMap(true));
  // @ts-expect-error The users namespace cannot receive the root handler table.
  const foreignTable: Reducer<State, ScopedAction, Effect> = reducing({ users: root, root });
  // @ts-expect-error No namespaces cover the declared actions.
  const empty: Reducer<State, ScopedAction, Effect> = reducing({});
  // @ts-expect-error Unknown namespaces cannot own handlers.
  const unknownScope: Reducer<State, ScopedAction, Effect> = reducing({ users, root, roles: users });
  // @ts-expect-error Unknown actions cannot be added to a namespace.
  const unknownAction: Reducer<State, ScopedAction, Effect> = reducing({ users: { ...users, ResetAction: root.ResetAction }, root });
  const noActions: Reducer<State, never, Effect> = reducing({});
  expectTypeOf(noActions).toEqualTypeOf<Reducer<State, never, Effect>>();
  void [missingScope, missingAction, optionalHandler, undefinedHandler, tableUnion, mapUnion, foreignTable, empty, unknownScope, unknownAction];
});

test('one scope/type pair cannot be declared twice in a handler map', () => {
  const handlers = { IdleAction: () => {} };
  // @ts-expect-error One namespace has one table; duplicate object keys are rejected by TypeScript.
  const duplicateScope: Reducer<State, Extract<Action, { type: 'IdleAction' }>, never> = reducing({ root: handlers, root: handlers });
  const duplicateAction: Reducer<State, Extract<Action, { type: 'IdleAction' }>, never> = reducing({ root: {
    IdleAction: handlers.IdleAction,
    // @ts-expect-error An action can have only one handler within its namespace.
    IdleAction: handlers.IdleAction,
  } });
  void [duplicateScope, duplicateAction];
});

test('requires a result contract or explicit generics for nonempty namespace maps', () => {
  // @ts-expect-error Without a contract, a nonempty map must not produce a broad reducer.
  const untyped = reducing({ root: { IdleAction: () => ({ state: 1 }) } });
  // @ts-expect-error A callback parameter does not supply the missing root contracts.
  const withState = reducing({ root: { IdleAction: ({ state }) => ({ state }) } });
  const handlers = define.reducer<State, Action, Effect>()({
    SetAction: ({ action }) => ({ state: { count: action.count } }),
    IdleAction: () => {},
  });
  // @ts-expect-error A table from a variable also requires a result contract.
  const fromVariable = reducing({ root: handlers });
  // @ts-expect-error Declaring never actions must not allow a nonempty namespace map.
  const noActions = reducing<State, never, Effect>({ root: handlers });

  const explicit = reducing<State, Action, Effect>({
    root: {
      SetAction: ({ action }) => {
        expectTypeOf(action).toEqualTypeOf<Extract<Action, { type: 'SetAction' }>>();
        return { state: { count: action.count } };
      },
      IdleAction: () => {},
    },
  });
  expect(explicit({ count: 0 }, { type: 'SetAction', count: 7 }).state.count).toBe(7);
  void [untyped, withState, fromVariable, noActions];
});
