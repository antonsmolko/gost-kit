import { expect, test } from 'vitest';
import { createModule } from './module.svelte.ts';

type Action = { type: 'RunAction' };
type Effect = { type: 'WorkEffect'; id: number };

test('effects start in parallel after state commit and dispatch waits for all', async () => {
  const requests = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const started: number[] = [];
  const root = createModule<{ count: number }, Action, Effect>({
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

test('module assigns the returned full state without merging old keys', async () => {
  const next = { count: 2 };
  const root = createModule<{ count: number; previous?: boolean }, Action, Effect>({
    initState: { count: 0, previous: true },
    reducer: () => ({ state: next, effects: [] }),
    effector: async () => {},
  });
  await root.dispatch({ type: 'RunAction' });
  expect(root.state).toBe(next);
  expect(root.state).not.toHaveProperty('previous');
});

test('a reducer exception rejects dispatch', async () => {
  const failure = new Error('Broken reducer');
  const root = createModule<null, Action, Effect>({
    initState: null,
    reducer: () => { throw failure; },
    effector: async () => {},
  });
  await expect(root.dispatch({ type: 'RunAction' })).rejects.toBe(failure);
});

test('dispatch waits for another effect and its nested state update after a rejection', async () => {
  type BatchAction = Action | { type: 'DoneAction' };
  const requests = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
  const firstError = new Error('First effect failed');
  const root = createModule<{ count: number }, BatchAction, Effect>({
    initState: { count: 0 },
    reducer: (state, action) => action.type === 'DoneAction'
      ? { state: { count: 2 }, effects: [] }
      : { state: { count: 1 }, effects: [
        { type: 'WorkEffect', id: 0 }, { type: 'WorkEffect', id: 1 },
      ] },
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
  requests[1].resolve();
  await pending;
  expect(root.state.count).toBe(2);
  expect(failure).toBeInstanceOf(AggregateError);
  expect((failure as AggregateError).errors).toEqual([firstError]);
});

test('synchronous effect throws do not skip siblings and all failures are collected', async () => {
  const failures = [new Error('First'), new Error('Second')];
  const started: number[] = [];
  const root = createModule<null, Action, Effect>({
    initState: null,
    reducer: () => ({ state: null, effects: [
      { type: 'WorkEffect', id: 0 }, { type: 'WorkEffect', id: 1 },
    ] }),
    effector: (effect) => {
      started.push(effect.id);
      if (effect.id === 0) throw failures[0];
      return Promise.reject(failures[1]);
    },
  });
  const failure: unknown = await root.dispatch({ type: 'RunAction' }).catch((error: unknown) => error);
  expect(started).toEqual([0, 1]);
  expect(failure).toBeInstanceOf(AggregateError);
  expect((failure as AggregateError).errors).toEqual(failures);
});
