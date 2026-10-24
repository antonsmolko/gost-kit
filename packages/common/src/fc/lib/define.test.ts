import { describe, expect, expectTypeOf, test } from 'vitest';
import type { Nlx } from '../../types/nlx';
import type { Ulx } from '../../types/ulx';
import { define } from './define';

test('define.reducer infers feature handlers and checks their returned state', () => {
  type FeatureState = { status: 'idle' | 'loading'; nested: { count: number }; items: string[] };
  type RootState = { user: FeatureState; auth: { user: { id: string }; roles: string[] } };
  type Action = { type: 'LoadAction'; count: number };
  const handlers = define.reducer<FeatureState, Action, never, RootState>()({
    LoadAction: ({ state, action }, rootState) => ({
      state: { ...state, status: 'loading', nested: { count: action.count }, items: [rootState.auth.user.id] },
    }),
  });
  const state: FeatureState = { status: 'idle', nested: { count: 0 }, items: [] };
  const rootState: RootState = { user: state, auth: { user: { id: '42' }, roles: [] } };
  expect(handlers.LoadAction({ state, action: { type: 'LoadAction', count: 7 } }, rootState)).toEqual({
    state: { status: 'loading', nested: { count: 7 }, items: ['42'] },
  });

  define.reducer<FeatureState, Action>()({
    // @ts-expect-error Extra state keys must be rejected without a return annotation.
    LoadAction: ({ state }) => ({ state: { ...state, wrongKey: 'loading' } }),
  });
  define.reducer<FeatureState, Action>()({
    // @ts-expect-error Extra nested state keys must also be rejected.
    LoadAction: ({ state }) => ({ state: { ...state, nested: { count: 0, wrongKey: true } } }),
  });
  define.reducer<FeatureState, Action>()({
    // @ts-expect-error Returning void in another branch must not bypass the state check.
    LoadAction: ({ state, action }) => action.count ? { state: { ...state, wrongKey: true } } : undefined,
  });
  define.reducer<FeatureState, Action>()({
    // @ts-expect-error An optional state property must not bypass the state check.
    LoadAction: ({ state }): { state?: FeatureState & { wrongKey: boolean } } => ({ state: { ...state, wrongKey: true } }),
  });
  define.reducer<FeatureState, Action, never, RootState>()({
    LoadAction: ({ state }, rootState) => {
      // @ts-expect-error Feature state is deeply readonly on input.
      state.nested.count = 1;
      // @ts-expect-error Root state nested properties cannot be mutated.
      rootState.auth.user.id = 'other';
      // @ts-expect-error Root state arrays cannot be mutated.
      rootState.auth.roles.push('admin');
      return { state };
    },
  });
});

type State = { counter: number; name: string; items: string[] };

describe('define.state', () => {
  test('принимает фабрику с необязательным объектом параметров', () => {
    const createState = define.state((options: { counter?: number } = {}): State => {
      return { counter: options.counter ?? 0, name: '', items: [] };
    });

    expectTypeOf(createState).parameters.toEqualTypeOf<[options?: { counter?: number }]>();
    expect(createState()).toEqual({ counter: 0, name: '', items: [] });
    expect(createState({ counter: 7 }).counter).toBe(7);
    expect(createState().items).not.toBe(createState().items);
  });

  test('создаёт состояние из initialState с частичными переопределениями', () => {
    const initialState = { counter: 0, name: 'initial' };
    const createState = define.state(initialState);

    expect(createState()).toEqual({ counter: 0, name: 'initial' });
    expect(createState({ counter: 7 })).toEqual({ counter: 7, name: 'initial' });
    expect(initialState).toEqual({ counter: 0, name: 'initial' });
    expect(createState()).not.toBe(initialState);
  });

  test('сохраняет тип состояния и частичных переопределений', () => {
    const createState = define.state<State>({ counter: 0, name: '', items: [] });

    expectTypeOf(createState).parameters.toEqualTypeOf<[overrides?: Partial<State>]>();
    expectTypeOf(createState).returns.toEqualTypeOf<State>();
  });

  test('перезаписывает начальное значение явно переданным undefined', () => {
    const createState = define.state<{ counter: Ulx<number>; name: string }>({ counter: 0, name: 'initial' });
    const overrides = { counter: undefined, name: 'updated' };

    expect(createState(overrides)).toEqual({ counter: undefined, name: 'updated' });
    expect(overrides).toEqual({ counter: undefined, name: 'updated' });
  });

  test('принимает null и ложные значения как явные переопределения', () => {
    const createState = define.state<{
      counter: number;
      name: string;
      enabled: boolean;
      selected: Nlx<string>;
    }>({ counter: 1, name: 'initial', enabled: true, selected: 'value' });

    expect(createState({ counter: 0, name: '', enabled: false, selected: null })).toEqual({
      counter: 0, name: '', enabled: false, selected: null,
    });
  });
});
