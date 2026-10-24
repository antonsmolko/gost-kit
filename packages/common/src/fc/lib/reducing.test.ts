import { expect, expectTypeOf, test } from 'vitest';
import { define } from './define';
import { reducing } from './reducing';
import type { Reducer } from '../types/reducer';
import type { ReducerHandlers } from '../types/reducer-handlers';

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

test('an empty handler result keeps state and yields no effects', () => {
  const reducer: Reducer<State, Extract<Action, { type: 'IdleAction' }>, Effect> = reducing({ IdleAction: () => {} });
  const state = { count: 0 };
  expect(reducer(state, { type: 'IdleAction' })).toEqual({ state, effects: [] });
});

test('effects-only results preserve state and normalize a single effect to an array', () => {
  const reducer: Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect> = reducing({
    SetAction: ({ action }) => ({ effects: { type: 'RecordEffect', value: action.count } }),
  });
  const state = { count: 0 };
  expect(reducer(state, { type: 'SetAction', count: 7 })).toEqual({
    state, effects: [{ type: 'RecordEffect', value: 7 }],
  });
});

test('requires coverage of every declared action', () => {
  const handlers = define.reducer<State, Extract<Action, { type: 'SetAction' }>, Effect>({
    SetAction: ({ state }) => ({ state }),
  });
  // @ts-expect-error IdleAction has no handler.
  const missing: Reducer<State, Action, Effect> = reducing(handlers);
  // @ts-expect-error No handlers cover the declared actions.
  const empty: Reducer<State, Action, Effect> = reducing();
  const optional: Partial<ReducerHandlers<State, Action, Effect>> = {};
  // @ts-expect-error Optional handlers cannot guarantee action coverage.
  const uncertain: Reducer<State, Action, Effect> = reducing(optional);
  const possiblyUndefined: { SetAction: typeof handlers.SetAction | undefined } = { SetAction: undefined };
  // @ts-expect-error A possibly undefined handler cannot guarantee action coverage.
  const undefinedReducer: Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect> = reducing(possiblyUndefined);
  const chooseTable = (first: boolean) => first ? handlers : { IdleAction: () => {} };
  // @ts-expect-error Each alternative is missing one declared action.
  const alternatives: Reducer<State, Action, Effect> = reducing(chooseTable(true));
  const chooseTables = (first: boolean) => first
    ? [handlers, { IdleAction: () => {} }] as const
    : [handlers] as const;
  // @ts-expect-error One tuple alternative is missing IdleAction.
  const alternativeTables: Reducer<State, Action, Effect> = reducing(...chooseTables(true));
  // @ts-expect-error Explicit tuple types must not bypass coverage of each alternative.
  const explicitAlternatives = reducing<State, Action, Effect, ReturnType<typeof chooseTables>>(...chooseTables(true));
  const dynamic = [handlers];
  // @ts-expect-error A dynamic array cannot prove handler ownership or coverage.
  const dynamicReducer: Reducer<State, Action, Effect> = reducing(...dynamic);
  // @ts-expect-error SetAction has two owners.
  const duplicate: Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect> = reducing(handlers, handlers);
  const noActions: Reducer<State, never, Effect> = reducing();
  expectTypeOf(missing).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(empty).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(uncertain).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(undefinedReducer).toEqualTypeOf<Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect>>();
  expectTypeOf(alternatives).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(alternativeTables).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(explicitAlternatives).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(dynamicReducer).toEqualTypeOf<Reducer<State, Action, Effect>>();
  expectTypeOf(duplicate).toEqualTypeOf<Reducer<State, Extract<Action, { type: 'SetAction' }>, Effect>>();
  expectTypeOf(noActions).toEqualTypeOf<Reducer<State, never, Effect>>();
});

test('retains inline action inference across complete tables', () => {
  const reducer: Reducer<State, Action, Effect> = reducing(
    { SetAction: ({ action }) => ({ state: { count: action.count } }) },
    { IdleAction: ({ state }) => ({ state }) },
  );
  expect(reducer({ count: 0 }, { type: 'SetAction', count: 3 }).state.count).toBe(3);
});
