import { flushSync } from 'svelte';
import type { StoreConfig } from '@gost-kit/common';
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
      reducer: (state) => {
        return { state, effects: [] };
      },
      effector: async () => {},
    });

    expect(store.state).toBe(initial);
    expect(store.state.counter).toBe(0);
  });

  test('updates reactive consumers after dispatch', async () => {
    const store = createStore<CounterState, CounterAction, never>({
      initState: { counter: 0 },
      reducer: (_state, action) => {
        return { state: { counter: action.counter }, effects: [] };
      },
      effector: async () => {},
    });
    const observed = observe(
      () => {
        return store.state;
      },
      (state) => {
        return state.counter;
      },
    );

    try {
      expect(observed.values).toEqual([0]);

      await store.dispatch({ type: 'SetCounterAction', counter: 7 });
      flushSync();

      expect(observed.values).toEqual([0, 7]);
    } finally {
      observed.stop();
    }
  });

  test('preserves presentation when another root branch changes', async () => {
    type RootState = { user: { name: string }; alert: string };
    type ReplaceAction = { type: 'ReplaceAction'; state: RootState };

    const initial: RootState = { user: { name: 'Ada' }, alert: '' };
    const store = createStore<RootState, ReplaceAction, never>({
      initState: initial,
      reducer: (_state, action) => {
        return { state: action.state, effects: [] };
      },
      effector: async () => {},
    });
    const userPresenter = vi.fn((user: RootState['user']) => {
      return { label: user.name.toUpperCase() };
    });
    const observed = observe(() => {
      return store.state.user;
    }, userPresenter);
    const directPresenter = vi.fn((state: RootState) => {
      return { label: state.user.name.toUpperCase() };
    });
    const direct = observe(() => {
      return store.state;
    }, directPresenter);

    try {
      expect(userPresenter).toHaveBeenCalledTimes(1);
      expect(observed.values).toEqual([{ label: 'ADA' }]);

      await store.dispatch({
        type: 'ReplaceAction',
        state: { ...initial, alert: 'Opened' },
      });
      flushSync();

      expect(userPresenter).toHaveBeenCalledTimes(1);
      expect(observed.values).toEqual([{ label: 'ADA' }]);
      expect(directPresenter).toHaveBeenCalledTimes(2);
      expect(direct.values).toEqual([{ label: 'ADA' }, { label: 'ADA' }]);

      await store.dispatch({
        type: 'ReplaceAction',
        state: { user: { name: 'Grace' }, alert: 'Opened' },
      });
      flushSync();

      expect(userPresenter).toHaveBeenCalledTimes(2);
      expect(observed.values).toEqual([{ label: 'ADA' }, { label: 'GRACE' }]);
      expect(directPresenter).toHaveBeenCalledTimes(3);
    } finally {
      observed.stop();
      direct.stop();
    }
  });

  test('isolates reactive state between stores created from the same config', async () => {
    const initial: CounterState = { counter: 0 };
    const config: StoreConfig<CounterState, CounterAction, never> = {
      initState: initial,
      reducer: (_state, action) => {
        return { state: { counter: action.counter }, effects: [] };
      },
      effector: async () => {},
    };
    const first = createStore(config);
    const second = createStore(config);
    const firstView = observe(
      () => {
        return first.state;
      },
      (state) => {
        return state.counter;
      },
    );
    const secondView = observe(
      () => {
        return second.state;
      },
      (state) => {
        return state.counter;
      },
    );

    try {
      expect(first.state).toBe(initial);
      expect(second.state).toBe(initial);

      await first.dispatch({ type: 'SetCounterAction', counter: 7 });
      flushSync();

      expect(firstView.values).toEqual([0, 7]);
      expect(secondView.values).toEqual([0]);
      expect(second.state).toBe(initial);

      await second.dispatch({ type: 'SetCounterAction', counter: 9 });
      flushSync();

      expect(firstView.values).toEqual([0, 7]);
      expect(secondView.values).toEqual([0, 9]);
      expect(first.state.counter).toBe(7);
      expect(second.state.counter).toBe(9);
    } finally {
      firstView.stop();
      secondView.stop();
    }
  });

  test.each([
    { kind: 'primitive', initial: 0, next: 7 },
    { kind: 'array', initial: [0], next: [7] },
  ])('reactively replaces the $kind root', async ({ initial, next }) => {
    const store = createStore<typeof initial, { type: 'ReplaceAction' }, never>(
      {
        initState: initial,
        reducer: () => {
          return { state: next, effects: [] };
        },
        effector: async () => {},
      },
    );
    const observed = observe(
      () => {
        return store.state;
      },
      (state) => {
        return state;
      },
    );

    try {
      expect(store.state).toBe(initial);

      await store.dispatch({ type: 'ReplaceAction' });
      flushSync();

      expect(store.state).toBe(next);
      expect(observed.values).toEqual([initial, next]);
      expect(observed.values[1]).toBe(next);
    } finally {
      observed.stop();
    }
  });
});
