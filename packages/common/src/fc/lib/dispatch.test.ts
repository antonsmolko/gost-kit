import { expect, test, vi } from 'vitest';
import { createDispatch } from './dispatch';
import { reducing } from './reducing';
import type { StoreConfig } from '../types/store-config';
import type { Store } from '../types/store';
import type { Trigger } from '../types/trigger';
import type { DispatchConfig } from '../types/dispatch-config';
import type { Commit } from '../types/commit';
import type { StoreError } from '../types/store-error';
import type { ScopedActions } from '../types/scoped-actions';

const createTestStore = <TState, TAction extends Trigger, TEffect extends Trigger>(config: StoreConfig<TState, TAction, TEffect>): Store<TState, TAction> => {
  let state = config.initState;
  const dispatch = createDispatch({
    ...config,
    readState: () => state,
    writeState: (next: TState) => { state = next; },
  });
  return { get state() { return state; }, dispatch };
};

type Action = { type: 'RunAction' };
type Effect = { type: 'WorkEffect'; id: number };
type TestDispatchConfig = DispatchConfig<number, Action, Effect>;

test('dispatch accepts explicit root scope without requiring it in the source action type', async () => {
  const received: Action[] = [];
  const root = createTestStore<number, Action, never>({
    initState: 0,
    reducer: (state, action) => {
      received.push(action);
      return { state: state + 1, effects: [] };
    },
    effector: async () => {},
  });
  const implicit: Action = { type: 'RunAction' };
  const explicit = { scope: 'root', type: 'RunAction' } as const;

  await root.dispatch(implicit);
  await root.dispatch({ scope: 'root', type: 'RunAction' });
  await root.dispatch(explicit);

  expect(root.state).toBe(3);
  expect(received[0]).toBe(implicit);
  expect(received[0]).not.toHaveProperty('scope');
  expect(received[2]).toBe(explicit);
});

test('dispatch commits before effects and awaits nested actions across namespaces', async () => {
  type State = { users: number; roles: string; message: string };
  type Action = ScopedActions<{
    users: { type: 'LoadAction'; page: number };
    roles: { type: 'LoadAction'; roleId: string };
    root: { type: 'LoadAction'; reason: string };
  }>;
  type Effect = { type: 'NextEffect'; target: 'roles' | 'root' };
  const firstRequest = Promise.withResolvers<void>();
  const lastRequest = Promise.withResolvers<void>();
  const rootEffectStarted = Promise.withResolvers<void>();
  const root = createTestStore<State, Action, Effect>({
    initState: { users: 0, roles: '', message: '' },
    reducer: reducing({
      users: { LoadAction: ({ state, action }) => ({
        state: { ...state, users: action.page }, effects: { type: 'NextEffect', target: 'roles' },
      }) },
      roles: { LoadAction: ({ state, action }) => ({
        state: { ...state, roles: action.roleId }, effects: { type: 'NextEffect', target: 'root' },
      }) },
      root: { LoadAction: ({ state, action }) => ({ state: { ...state, message: action.reason } }) },
    }),
    effector: async (effect, dispatch) => {
      if (effect.target === 'roles') {
        expect(root.state.users).toBe(7);
        await firstRequest.promise;
        await dispatch({ scope: 'roles', type: 'LoadAction', roleId: 'admin' });
      } else {
        expect(root.state.roles).toBe('admin');
        rootEffectStarted.resolve();
        await lastRequest.promise;
        await dispatch({ type: 'LoadAction', reason: 'ready' });
      }
    },
  });
  let completed = false;
  const pending = root.dispatch({ scope: 'users', type: 'LoadAction', page: 7 }).then(() => { completed = true; });
  expect(root.state).toEqual({ users: 7, roles: '', message: '' });
  firstRequest.resolve();
  await rootEffectStarted.promise;
  expect(root.state).toEqual({ users: 7, roles: 'admin', message: '' });
  expect(completed).toBe(false);
  lastRequest.resolve();
  await pending;
  expect(root.state).toEqual({ users: 7, roles: 'admin', message: 'ready' });
  expect(completed).toBe(true);
});

test('scoped reducer and effect failures retain the original action and effect context', async () => {
  type Action = ScopedActions<{
    users: { type: 'LoadAction'; page: number };
    roles: { type: 'LoadAction'; roleId: string };
  }>;
  const reducerFailure = new Error('Users reducer failed');
  const effectFailure = new Error('Roles effect failed');
  const effect: Effect = { type: 'WorkEffect', id: 7 };
  const reported: StoreError<Action, Effect>[] = [];
  const root = createTestStore<number, Action, Effect>({
    initState: 0,
    reducer: reducing({
      users: { LoadAction: () => { throw reducerFailure; } },
      roles: { LoadAction: ({ action }) => ({ state: action.roleId.length, effects: effect }) },
    }),
    effector: async () => { throw effectFailure; },
    onError: (failure) => { reported.push(failure); },
  });
  const users: Action = { scope: 'users', type: 'LoadAction', page: 7 };
  const roles: Action = { scope: 'roles', type: 'LoadAction', roleId: 'admin' };

  await expect(root.dispatch(users)).resolves.toBeUndefined();
  expect(root.state).toBe(0);
  await expect(root.dispatch(roles)).resolves.toBeUndefined();
  expect(root.state).toBe(5);
  expect(reported).toEqual([
    { kind: 'reducer', action: users, error: reducerFailure },
    { kind: 'effect', action: roles, effect, error: effectFailure },
  ]);
  expect(reported[0].action).toBe(users);
  expect(reported[1].action).toBe(roles);
  if (reported[1].kind === 'effect') expect(reported[1].effect).toBe(effect);
});

test('a readState failure is reported before reducer, writeState or effects run', async () => {
  const failure = new Error('Cannot read state');
  const onError = vi.fn<NonNullable<TestDispatchConfig['onError']>>();
  const reducer = vi.fn<TestDispatchConfig['reducer']>(() => ({
    state: 1, effects: [{ type: 'WorkEffect', id: 0 }],
  }));
  const writeState = vi.fn<TestDispatchConfig['writeState']>();
  const effector = vi.fn<TestDispatchConfig['effector']>(async () => {});
  const dispatch = createDispatch<number, Action, Effect>({
    readState: () => { throw failure; },
    reducer,
    writeState,
    effector,
    onError,
  });
  const action: Action = { type: 'RunAction' };

  await expect(dispatch(action)).resolves.toBeUndefined();

  expect(onError).toHaveBeenCalledExactlyOnceWith({ kind: 'readState', action, error: failure });
  expect(reducer).not.toHaveBeenCalled();
  expect(writeState).not.toHaveBeenCalled();
  expect(effector).not.toHaveBeenCalled();
});

test('a writeState failure is reported after reducer and prevents effects', async () => {
  const failure = new Error('Cannot write state');
  const onError = vi.fn<NonNullable<TestDispatchConfig['onError']>>();
  const reducer = vi.fn<TestDispatchConfig['reducer']>(() => ({
    state: 1, effects: [{ type: 'WorkEffect', id: 0 }],
  }));
  const writeState = vi.fn<TestDispatchConfig['writeState']>(() => { throw failure; });
  const effector = vi.fn<TestDispatchConfig['effector']>(async () => {});
  const dispatch = createDispatch<number, Action, Effect>({
    readState: () => 0,
    reducer,
    writeState,
    effector,
    onError,
  });
  const action: Action = { type: 'RunAction' };

  await expect(dispatch(action)).resolves.toBeUndefined();

  expect(onError).toHaveBeenCalledExactlyOnceWith({ kind: 'writeState', action, error: failure });
  expect(reducer).toHaveBeenCalledExactlyOnceWith(0, action);
  expect(writeState).toHaveBeenCalledExactlyOnceWith(1);
  expect(effector).not.toHaveBeenCalled();
});

test('effects start in parallel after state commit and dispatch waits for all', async () => {
  const requests = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const started: number[] = [];
  const root = createTestStore<{ count: number }, Action, Effect>({
    initState: { count: 0 },
    reducer: () => ({ state: { count: 1 }, effects: [
      { type: 'WorkEffect', id: 0 }, { type: 'WorkEffect', id: 1 },
    ] }),
    effector: async (effect) => {
      expect(root.state.count).toBe(1);
      started.push(effect.id);
      await requests[effect.id].promise;
    },
  });
  let completed = false;
  const pending = root.dispatch({ type: 'RunAction' }).then(() => { completed = true; });
  expect(started).toEqual([0, 1]);
  requests[1].resolve();
  await Promise.resolve();
  expect(completed).toBe(false);
  requests[0].resolve();
  await pending;
  expect(completed).toBe(true);
});

test('dispatch assigns the returned full state without merging old keys', async () => {
  const next = { count: 2 };
  const root = createTestStore<{ count: number; previous?: boolean }, Action, Effect>({
    initState: { count: 0, previous: true },
    reducer: () => ({ state: next, effects: [] }),
    effector: async () => {},
  });
  await root.dispatch({ type: 'RunAction' });
  expect(root.state).toBe(next);
  expect(root.state).not.toHaveProperty('previous');
});

test('a reducer exception is reported with the action and dispatch resolves', async () => {
  const reported: StoreError<Action, Effect>[] = [];
  const failure = new Error('Broken reducer');
  const root = createTestStore<null, Action, Effect>({
    initState: null,
    reducer: () => { throw failure; },
    effector: async () => {},
    onError: (error) => { reported.push(error); },
  });
  await expect(root.dispatch({ type: 'RunAction' })).resolves.toBeUndefined();
  expect(root.state).toBeNull();
  expect(reported).toEqual([{ kind: 'reducer', action: { type: 'RunAction' }, error: failure }]);
});

test('dispatch waits for another effect and its nested state update after a rejection', async () => {
  type BatchAction = Action | { type: 'DoneAction' };
  const requests = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const firstError = new Error('First effect failed');
  const reported: StoreError<BatchAction, Effect>[] = [];
  const root = createTestStore<{ count: number }, BatchAction, Effect>({
    initState: { count: 0 },
    reducer: (state, action) => action.type === 'DoneAction'
      ? { state: { count: 2 }, effects: [] }
      : { state: { count: 1 }, effects: [
        { type: 'WorkEffect', id: 0 }, { type: 'WorkEffect', id: 1 },
      ] },
    onError: (error) => { reported.push(error); },
    effector: async (effect, dispatch) => {
      await requests[effect.id].promise;
      if (effect.id === 1) await dispatch({ type: 'DoneAction' });
    },
  });
  let settled = false;
  let failure: unknown;
  const pending = root.dispatch({ type: 'RunAction' }).then(
    () => { settled = true; },
    (error: unknown) => { settled = true; failure = error; },
  );
  requests[0].reject(firstError);
  // Drain the current promise jobs before checking that dispatch is still pending.
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(settled).toBe(false);
  expect(root.state.count).toBe(1);
  expect(reported).toEqual([]);
  requests[1].resolve();
  await pending;
  expect(root.state.count).toBe(2);
  expect(failure).toBeUndefined();
  expect(reported).toEqual([{ kind: 'effect', action: { type: 'RunAction' },
    effect: { type: 'WorkEffect', id: 0 }, error: firstError }]);
});

test('synchronous effect throws do not skip siblings and all failures are collected', async () => {
  const failures = [new Error('First'), new Error('Second')];
  const started: number[] = [];
  const reported: StoreError<Action, Effect>[] = [];
  const root = createTestStore<null, Action, Effect>({
    initState: null,
    reducer: () => ({ state: null, effects: [
      { type: 'WorkEffect', id: 0 }, { type: 'WorkEffect', id: 1 },
    ] }),
    onError: (error) => { reported.push(error); },
    effector: (effect) => {
      started.push(effect.id);
      if (effect.id === 0) throw failures[0];
      return Promise.reject(failures[1]);
    },
  });
  const failure: unknown = await root.dispatch({ type: 'RunAction' }).catch((error: unknown) => error);
  expect(started).toEqual([0, 1]);
  expect(failure).toBeUndefined();
  expect(reported).toEqual(failures.map((error, id) => ({
    kind: 'effect', action: { type: 'RunAction' }, effect: { type: 'WorkEffect', id }, error,
  })));
});

test('a nested reducer failure is reported once by the nested dispatch', async () => {
  type NestedAction = Action | { type: 'NestedAction' };
  const failure = new Error('Nested reducer failed');
  const reported: StoreError<NestedAction, Effect>[] = [];
  const root = createTestStore<{ count: number }, NestedAction, Effect>({
    initState: { count: 0 },
    reducer: (state, action) => {
      if (action.type === 'NestedAction') throw failure;
      return { state: { count: 1 }, effects: [{ type: 'WorkEffect', id: 0 }] };
    },
    effector: async (_effect, dispatch) => { await dispatch({ type: 'NestedAction' }); },
    onError: (error) => { reported.push(error); },
  });
  await expect(root.dispatch({ type: 'RunAction' })).resolves.toBeUndefined();
  expect(root.state.count).toBe(1);
  expect(reported).toEqual([{ kind: 'reducer', action: { type: 'NestedAction' }, error: failure }]);
});

test('the default error handler logs context without rejecting dispatch', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const failure = new Error('Effect failed');
  try {
    const root = createTestStore<null, Action, Effect>({
      initState: null,
      reducer: () => ({ state: null, effects: [{ type: 'WorkEffect', id: 0 }] }),
      effector: async () => { throw failure; },
    });
    await expect(root.dispatch({ type: 'RunAction' })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledExactlyOnceWith({
      kind: 'effect', action: { type: 'RunAction' }, effect: { type: 'WorkEffect', id: 0 }, error: failure,
    });
  } finally {
    log.mockRestore();
  }
});

test('a rejected error handler is logged by the fallback without rejecting dispatch', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const failure = new Error('Reducer failed');
  const reporterFailure = new Error('Reporter failed');
  const context = { kind: 'reducer', action: { type: 'RunAction' }, error: failure };
  try {
    const root = createTestStore<null, Action, Effect>({
      initState: null,
      reducer: () => { throw failure; },
      effector: async () => {},
      onError: async () => { throw reporterFailure; },
    });
    await expect(root.dispatch({ type: 'RunAction' })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledExactlyOnceWith('Error handler failed', {
      failure: context, error: reporterFailure,
    });
  } finally {
    log.mockRestore();
  }
});

test('invalid reducer output is caught inside dispatch as a reducer failure', async () => {
  const reported: StoreError<Action, Effect>[] = [];
  const root = createTestStore<null, Action, Effect>({
    initState: null,
    reducer: () => ({ state: null, effects: undefined }) as unknown as Commit<null, Effect>,
    effector: async () => {},
    onError: (error) => { reported.push(error); },
  });
  await expect(root.dispatch({ type: 'RunAction' })).resolves.toBeUndefined();
  expect(reported[0].kind).toBe('reducer');
});
