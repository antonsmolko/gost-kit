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
