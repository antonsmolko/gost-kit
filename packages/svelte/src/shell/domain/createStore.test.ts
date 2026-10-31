import { flushSync } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { createStore } from './createStore.svelte';
import { observe } from './__tests__/observe.svelte';

type CounterState = { counter: number };
type CounterAction = { type: 'SetCounterAction'; counter: number };

describe('createStore', () => {
  test('preserves initial state without adding deep reactivity', () => {
    const initial: CounterState = { counter: 0 };
    const store = createStore<CounterState, CounterAction, never>({
      initState: initial,
      reducer: (state) => ({ state, effects: [] }),
      effector: async () => {},
    });

    expect(store.state).toBe(initial);
    expect(store.state.counter).toBe(0);
  });

  test('updates reactive consumers after dispatch', async () => {
    const store = createStore<CounterState, CounterAction, never>({
      initState: { counter: 0 },
      reducer: (_state, action) => ({ state: { counter: action.counter }, effects: [] }),
      effector: async () => {},
    });
    const observed = observe(() => store.state, (state) => state.counter);

    try {
      expect(observed.values).toEqual([0]);

      await store.dispatch({ type: 'SetCounterAction', counter: 7 });
      flushSync();

      expect(observed.values).toEqual([0, 7]);
    } finally {
      observed.stop();
    }
  });

  test('recomputes presentation only when the selected feature changes', async () => {
    type RootState = { user: { name: string }; alert: string };
    type ReplaceAction = { type: 'ReplaceAction'; state: RootState };
    const initial: RootState = { user: { name: 'Ada' }, alert: '' };
    const store = createStore<RootState, ReplaceAction, never>({
      initState: initial,
      reducer: (_state, action) => ({ state: action.state, effects: [] }),
      effector: async () => {},
    });
    const userPresenter = vi.fn((user: RootState['user']) => ({ label: user.name.toUpperCase() }));
    const observed = observe(() => store.state.user, userPresenter);

    try {
      expect(userPresenter).toHaveBeenCalledTimes(1);
      expect(observed.values).toEqual([{ label: 'ADA' }]);

      await store.dispatch({ type: 'ReplaceAction', state: { ...initial, alert: 'Opened' } });
      flushSync();

      expect(userPresenter).toHaveBeenCalledTimes(1);
      expect(observed.values).toEqual([{ label: 'ADA' }]);

      await store.dispatch({
        type: 'ReplaceAction', state: { ...store.state, user: { name: 'Grace' } },
      });
      flushSync();

      expect(userPresenter).toHaveBeenCalledTimes(2);
      expect(observed.values).toEqual([{ label: 'ADA' }, { label: 'GRACE' }]);
    } finally {
      observed.stop();
    }
  });
});
