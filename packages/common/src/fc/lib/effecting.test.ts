import { expect, test } from 'vitest';
import { define } from './define.ts';
import { effecting } from './effecting.ts';
import type { Effector } from '../types/effector.ts';

type Action = { type: 'SetAction'; count: number } | { type: 'IdleAction' };
type Effect = { type: 'RecordEffect'; value: number } | { type: 'OtherEffect' };

test('effecting composes effect tables and forwards dispatch and async completion', async () => {
  const completion = Promise.withResolvers<void>();
  const actions: Action[] = [];
  const first = define.effector<Action, Extract<Effect, { type: 'RecordEffect' }>>({
    RecordEffect: async ({ effect, dispatch }) => {
      await dispatch({ type: 'SetAction', count: effect.value });
      await completion.promise;
    },
  });
  const second = define.effector<Action, Extract<Effect, { type: 'OtherEffect' }>>({
    OtherEffect: async ({ dispatch }) => { await dispatch({ type: 'IdleAction' }); },
  });
  const effector: Effector<Action, Effect> = effecting(first, second);
  let completed = false;
  const dispatch = async (action: Action) => { actions.push(action); };
  const pending = effector({ type: 'RecordEffect', value: 7 }, dispatch)
    .then(() => { completed = true; });
  await Promise.resolve();
  expect(actions).toEqual([{ type: 'SetAction', count: 7 }]);
  expect(completed).toBe(false);
  completion.resolve();
  await pending;
  await effector({ type: 'OtherEffect' }, dispatch);
  expect(actions[1]).toEqual({ type: 'IdleAction' });
});

test('unregistered effects complete without dispatch', async () => {
  const actions: Action[] = [];
  const effector: Effector<Action, Effect> = effecting();
  await effector({ type: 'OtherEffect' }, async (action) => { actions.push(action); });
  expect(actions).toEqual([]);
});
