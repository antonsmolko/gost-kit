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
      initState: () => {
        return initial;
      },
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
      initState: () => {
        return { counter: 0 };
      },
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
      initState: () => {
        return initial;
      },
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
      initState: () => {
        return { ...initial };
      },
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
      expect(first.state).toEqual(initial);
      expect(second.state).toEqual(initial);
      expect(first.state).not.toBe(second.state);

      await first.dispatch({ type: 'SetCounterAction', counter: 7 });
      flushSync();

      expect(firstView.values).toEqual([0, 7]);
      expect(secondView.values).toEqual([0]);
      expect(second.state).toEqual(initial);

      await second.dispatch({ type: 'SetCounterAction', counter: 9 });
      flushSync();

      expect(firstView.values).toEqual([0, 7]);
      expect(secondView.values).toEqual([0, 9]);
      expect(first.state.counter).toBe(7);
      expect(second.state.counter).toBe(9);

      first.reset();
      flushSync();

      expect(first.state.counter).toBe(0);
      expect(second.state.counter).toBe(9);
      expect(firstView.values).toEqual([0, 7, 0]);
      expect(secondView.values).toEqual([0, 9]);
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
        initState: () => {
          return initial;
        },
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

      store.reset();
      flushSync();

      expect(store.state).toBe(initial);
      expect(observed.values).toEqual([initial, next, initial]);
    } finally {
      observed.stop();
    }
  });
});

test('captures the factory and calls it without arguments on creation and every reset', async () => {
  const initialState = vi.fn(() => {
    return { counter: 0 };
  });
  const config: StoreConfig<CounterState, CounterAction, never> = {
    initState: initialState,
    reducer: (_state, action) => {
      return {
        state: { counter: action.counter },
        effects: [],
      };
    },
    effector: async () => {},
  };
  const store = createStore(config);
  const originalStore = store;
  const originalDispatch = store.dispatch;
  const originalReset = store.reset;

  config.initState = () => {
    return { counter: 99 };
  };
  expect(initialState.mock.calls).toEqual([[]]);
  await store.dispatch({ type: 'SetCounterAction', counter: 8 });
  store.reset();
  expect(store.state).toEqual({ counter: 0 });
  store.reset({ excluded: ['counter'] });
  store.reset({ excluded: [] });
  expect(initialState.mock.calls).toEqual([[], [], [], []]);
  expect(store).toBe(originalStore);
  expect(store.dispatch).toBe(originalDispatch);
  expect(store.reset).toBe(originalReset);
  await store.dispatch({ type: 'SetCounterAction', counter: 12 });
  expect(store.state.counter).toBe(12);
});

test('publishes a complete reset once and preserves excluded scope presentation', async () => {
  type RootState = { user: { name: string }; alerts: string[]; count: number };
  type ReplaceAction = { type: 'ReplaceAction'; state: RootState };

  const store = createStore<RootState, ReplaceAction, never>({
    initState: () => {
      return { user: { name: '' }, alerts: [], count: 0 };
    },
    reducer: (_state, action) => {
      return { state: action.state, effects: [] };
    },
    effector: async () => {},
  });
  const selected = { name: 'Ada' };

  await store.dispatch({
    type: 'ReplaceAction',
    state: { user: selected, alerts: ['open'], count: 8 },
  });

  const presenter = vi.fn((user: RootState['user']) => {
    return user.name;
  });
  const scope = observe(() => {
    return store.state.user;
  }, presenter);
  const root = observe(
    () => {
      return store.state;
    },
    (state) => {
      return {
        name: state.user.name,
        alerts: state.alerts.length,
        count: state.count,
      };
    },
  );

  try {
    store.reset({ excluded: ['user'] });
    flushSync();
    expect(store.state.user).toBe(selected);
    expect(presenter).toHaveBeenCalledTimes(1);
    expect(scope.values).toEqual(['Ada']);
    expect(root.values).toEqual([
      { name: 'Ada', alerts: 1, count: 8 },
      { name: 'Ada', alerts: 0, count: 0 },
    ]);
    store.reset();
    flushSync();
    expect(presenter).toHaveBeenCalledTimes(2);
    expect(scope.values).toEqual(['Ada', '']);
  } finally {
    scope.stop();
    root.stop();
  }
});

test('does not change state or notify consumers if a reset factory fails', () => {
  const failure = new Error('reset factory failed');
  let fail = false;
  const store = createStore<CounterState, CounterAction, never>({
    initState: () => {
      if (fail) {
        throw failure;
      }

      return { counter: 0 };
    },
    reducer: (state) => {
      return { state, effects: [] };
    },
    effector: async () => {},
  });
  const previous = store.state;
  const observed = observe(
    () => {
      return store.state;
    },
    (state) => {
      return state.counter;
    },
  );

  try {
    fail = true;
    expect(() => {
      return store.reset();
    }).toThrow(failure);
    flushSync();
    expect(store.state).toBe(previous);
    expect(observed.values).toEqual([0]);
  } finally {
    observed.stop();
  }
});

test('allows an already pending effect to dispatch against the reset state', async () => {
  const gate = Promise.withResolvers<void>();

  type Action = { type: 'StartAction' } | { type: 'CompleteAction' };

  const store = createStore<CounterState, Action, { type: 'WaitEffect' }>({
    initState: () => {
      return { counter: 0 };
    },
    reducer: (state, action) => {
      return action.type === 'StartAction'
        ? { state: { counter: 100 }, effects: [{ type: 'WaitEffect' }] }
        : { state: { counter: state.counter + 1 }, effects: [] };
    },
    effector: async (_effect, dispatch) => {
      await gate.promise;
      await dispatch({ type: 'CompleteAction' });
    },
  });
  let settled = false;
  const pending = store.dispatch({ type: 'StartAction' }).then(() => {
    settled = true;
  });

  expect(store.state.counter).toBe(100);
  store.reset();
  expect(store.state.counter).toBe(0);
  expect(settled).toBe(false);
  gate.resolve();
  await pending;
  expect(store.state.counter).toBe(1);
  expect(settled).toBe(true);
});
