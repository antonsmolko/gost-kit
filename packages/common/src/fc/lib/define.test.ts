import { describe, expect, expectTypeOf, test } from 'vitest';
import type { Nlx } from '../../types/nlx.ts';
import type { Ulx } from '../../types/ulx.ts';
import { define } from './define.ts';

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
