import { expect, test } from 'vitest';
import { define } from './define.ts';
import { reducing } from './reducing.ts';
import type { Reducer } from '../types/reducer.ts';

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
  const reducer: Reducer<State, Action, Effect> = reducing(feature, other);
  expect(reducer({ count: 0, previous: true }, { type: 'SetAction', count: 7 })).toEqual({
    state: { count: 7 }, effects: [],
  });
  const state = { count: 7 };
  expect(reducer(state, { type: 'IdleAction' }).state).toBe(state);
});

test('missing handler or empty result keeps state and yields no effects', () => {
  const reducer: Reducer<State, Action, Effect> = reducing({ IdleAction: () => {} });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({ state, effects: [] });
  expect(reducer(state, { type: 'IdleAction' })).toEqual({ state, effects: [] });
});

test('effects-only results preserve state and normalize a single effect to an array', () => {
  const reducer: Reducer<State, Action, Effect> = reducing({
    SetAction: ({ action }) => ({ effects: { type: 'RecordEffect', value: action.count } }),
  });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({
    state, effects: [{ type: 'RecordEffect', value: 7 }],
  });
});
