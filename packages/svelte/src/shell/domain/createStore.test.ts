import { flushSync } from 'svelte';
import type { StoreConfig, StoreError } from '@gost/common';
import { describe, expect, test } from 'vitest';
import { createStore } from './createStore.svelte';
import { observe } from './__tests__/observe.svelte';

type State = { counter: number; previous?: boolean };
type Action = { type: 'SetCounterAction'; counter: number };
type Effect = { type: 'WorkEffect' };

const STATE: State = { counter: 0 };

describe('createStore', () => {
  test('сохраняет начальное состояние без глубокой реактивной обёртки', () => {
    const store = createStore<State, Action, Effect>({
      initState: STATE,
      effector: () => {
        return Promise.resolve();
      },
      reducer: (state) => {
        return { state, effects: [] };
      },
    });

    expect(store.state).toBe(STATE);
    expect(store.state.counter).toBe(0);
  });

  test('изменяет состояние синхронно до завершения dispatch', async () => {
    const store = createStore<State, Action, Effect>({
      initState: STATE,
      effector: () => {
        return Promise.resolve();
      },
      reducer: (_state, action) => {
        return { state: { counter: action.counter }, effects: [] };
      },
    });

    const pending = store.dispatch({ type: 'SetCounterAction', counter: 7 });

    expect(store.state.counter).toBe(7);
    await pending;
  });

  test('реактивно заменяет состояние целиком', async () => {
    const nextState: State = { counter: 7 };
    const store = createStore<State, Action, Effect>({
      initState: { counter: 0, previous: true },
      effector: () => {
        return Promise.resolve();
      },
      reducer: () => {
        return { state: nextState, effects: [] };
      },
    });
    const observed = observe(() => store.state.counter);

    try {
      expect(observed.values).toEqual([0]);

      await store.dispatch({ type: 'SetCounterAction', counter: 7 });
      flushSync();

      expect(observed.values).toEqual([0, 7]);
      expect(store.state).toBe(nextState);
      expect(store.state).not.toHaveProperty('previous');
    } finally {
      observed.stop();
    }
  });

  test('запускает эффект после commit и ожидает его завершения', async () => {
    const completion = Promise.withResolvers<void>();
    const observed: number[] = [];
    const store = createStore<State, Action, Effect>({
      initState: STATE,
      reducer: (_state, action) => {
        return {
          state: { counter: action.counter },
          effects: [{ type: 'WorkEffect' }],
        };
      },
      effector: async () => {
        observed.push(store.state.counter);
        await completion.promise;
      },
    });
    let completed = false;
    const pending = store.dispatch({ type: 'SetCounterAction', counter: 7 }).then(() => {
      completed = true;
    });

    expect(observed).toEqual([7]);
    await Promise.resolve();
    expect(completed).toBe(false);

    completion.resolve();
    await pending;

    expect(completed).toBe(true);
  });

  test('передаёт ошибку в onError и сохраняет состояние', async () => {
    const failure = new Error('Broken reducer');
    const reported: StoreError<Action, Effect>[] = [];
    const action: Action = { type: 'SetCounterAction', counter: 7 };
    const store = createStore<State, Action, Effect>({
      initState: STATE,
      reducer: () => {
        throw failure;
      },
      effector: () => {
        return Promise.resolve();
      },
      onError: (error) => {
        reported.push(error);
      },
    });

    await expect(store.dispatch(action)).resolves.toBeUndefined();

    expect(store.state).toBe(STATE);
    expect(reported).toEqual([{ kind: 'reducer', action, error: failure }]);
  });

  test('использует актуальные reducer и effector из конфигурации', async () => {
    const effects: string[] = [];
    const config: StoreConfig<State, Action, Effect> = {
      initState: { counter: 1 },
      reducer: (_state, action) => {
        return { state: { counter: action.counter }, effects: [{ type: 'WorkEffect' }] };
      },
      effector: async () => {
        effects.push('original');
      },
    };
    const store = createStore(config);

    config.reducer = (state, action) => {
      return {
        state: { counter: state.counter + action.counter },
        effects: [{ type: 'WorkEffect' }],
      };
    };
    config.effector = async () => {
      effects.push('replacement');
    };

    await store.dispatch({ type: 'SetCounterAction', counter: 7 });

    expect(store.state.counter).toBe(8);
    expect(effects).toEqual(['replacement']);
  });

  test('сохраняет исходную конфигурацию как this обработчиков', async () => {
    const receivers: unknown[] = [];
    const config: StoreConfig<State, Action, Effect> = {
      initState: STATE,
      reducer(_state, action) {
        receivers.push(this);
        return { state: { counter: action.counter }, effects: [{ type: 'WorkEffect' }] };
      },
      async effector() {
        receivers.push(this);
      },
    };
    const store = createStore(config);
    await store.dispatch({ type: 'SetCounterAction', counter: 7 });
    expect(store.state.counter).toBe(7);
    expect(receivers).toHaveLength(2);
    expect(receivers[0]).toBe(config);
    expect(receivers[1]).toBe(config);
  });

  test('изолирует состояние разных экземпляров', async () => {
    const config: StoreConfig<State, Action, Effect> = {
      initState: STATE,
      reducer: (_state, action) => {
        return { state: { counter: action.counter }, effects: [] };
      },
      effector: () => {
        return Promise.resolve();
      },
    };
    const first = createStore(config);
    const second = createStore(config);

    await first.dispatch({ type: 'SetCounterAction', counter: 9 });

    expect(first.state.counter).toBe(9);
    expect(second.state.counter).toBe(0);
  });
});
