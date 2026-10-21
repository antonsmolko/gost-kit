import { expect, test } from 'vitest';
import { define, effecting, reducing } from './handlers.ts';

type State = { count: number; previous?: boolean };
type Action = { type: 'SetAction'; count: number } | { type: 'IdleAction' };
type Effect = { type: 'RecordEffect'; value: number } | { type: 'OtherEffect' };

test('reducing composes feature tables and routes the narrowed action payload', () => {
  const feature = define.reducer<State, Extract<Action, { type: 'SetAction' }>, Effect>({
    SetAction: ({ action }) => ({ state: { count: action.count } }),
  });
  const other = define.reducer<State, Extract<Action, { type: 'IdleAction' }>, Effect>({
    IdleAction: ({ state }) => ({ state }),
  });
  const reducer = reducing<State, Action, Effect>(feature, other);
  expect(reducer({ count: 0, previous: true }, { type: 'SetAction', count: 7 })).toEqual({
    state: { count: 7 }, effects: [],
  });
  const state = { count: 7 };
  expect(reducer(state, { type: 'IdleAction' }).state).toBe(state);
});

test('missing handler or empty result keeps state and yields no effects', () => {
  const reducer = reducing<State, Action, Effect>({ IdleAction: () => {} });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({ state, effects: [] });
  expect(reducer(state, { type: 'IdleAction' })).toEqual({ state, effects: [] });
});

test('effects-only results preserve state and normalize a single effect to an array', () => {
  const reducer = reducing<State, Action, Effect>({
    SetAction: ({ action }) => ({ effects: { type: 'RecordEffect', value: action.count } }),
  });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({
    state, effects: [{ type: 'RecordEffect', value: 7 }],
  });
});

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
  const effector = effecting<Action, Effect>(first, second);
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
  await effecting<Action, Effect>()({ type: 'OtherEffect' }, async (action) => { actions.push(action); });
  expect(actions).toEqual([]);
});
