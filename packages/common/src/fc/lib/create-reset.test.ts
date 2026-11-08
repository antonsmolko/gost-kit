import { expect, expectTypeOf, test, vi } from 'vitest';
import { createReset } from './create-reset';
import { define } from './define';
import type { Reset } from '../types/reset';
import type { ResetError } from '../types/reset-error';

const usersState = define.state<{ errors: string[] }>((options = {}) => {
  return { errors: [], ...options };
});
const rootState = define.state<{
  users: ReturnType<typeof usersState>;
  auth: { token: string };
  alerts: string[];
}>((options = {}) => {
  return { users: usersState(), auth: { token: '' }, alerts: [], ...options };
});

test('creates initial nested defaults on every reset without mutating prior state', () => {
  const previous = rootState({ users: usersState({ errors: ['failed'] }) });
  let state = previous;
  const initState = vi.fn(rootState);
  const writes: (typeof state)[] = [];
  const reset = createReset({
    initState,
    readState: () => {
      return state;
    },
    writeState: (next) => {
      writes.push(next);
      state = next;
    },
  });

  expect(initState).not.toHaveBeenCalled();
  reset();

  const first = state;

  reset();

  expect(state).toEqual({
    users: { errors: [] },
    auth: { token: '' },
    alerts: [],
  });
  expect(state.users.errors).not.toBe(first.users.errors);
  expect(state.auth).not.toBe(first.auth);
  expect(previous.users.errors).toEqual(['failed']);
  expect(writes).toHaveLength(2);
  expect(initState.mock.calls).toEqual([[], []]);
});

test('preserves multiple excluded references and publishes only the composed root', () => {
  const previous = rootState({ auth: { token: 'session' }, alerts: ['saved'] });
  const initial = Object.freeze(rootState());
  let state = previous;
  const writes: (typeof state)[] = [];
  const reset = createReset({
    initState: () => {
      return initial;
    },
    readState: () => {
      return state;
    },
    writeState: (next) => {
      writes.push(next);
      state = next;
    },
  });

  reset({ excluded: ['auth', 'alerts', 'auth'] });

  expect(writes).toEqual([
    { users: { errors: [] }, auth: { token: 'session' }, alerts: ['saved'] },
  ]);
  expect(state.auth).toBe(previous.auth);
  expect(state.alerts).toBe(previous.alerts);
  expect(state.users).toBe(initial.users);
  expect(state).not.toBe(initial);
  expect(initial.auth.token).toBe('');
});

test.each([undefined, {}, { excluded: undefined }, { excluded: [] }])(
  'treats %j as a full reset',
  (options) => {
    const initial = rootState();
    const writeState = vi.fn();
    const readState = vi.fn(() => {
      return rootState();
    });

    createReset({
      initState: () => {
        return initial;
      },
      readState,
      writeState,
    })(options);
    expect(writeState).toHaveBeenCalledExactlyOnceWith(initial);
  },
);

test.each([null, 'auth', '', {}, { length: 0 }, 7, false])(
  'rejects non-array excluded %j before executing state callbacks',
  (excluded) => {
    const initState = vi.fn(rootState);
    const readState = vi.fn(rootState);
    const writeState = vi.fn();
    const onError = vi.fn();
    const reset = createReset({ initState, readState, writeState, onError });

    Reflect.apply(reset, undefined, [{ excluded }]);
    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'reset',
      error: new TypeError('Reset excluded must be an array of root keys'),
    });
    expect(initState).not.toHaveBeenCalled();
    expect(readState).not.toHaveBeenCalled();
    expect(writeState).not.toHaveBeenCalled();
  },
);

test('calls the factory without overrides even when all scopes are excluded', () => {
  const current = rootState({ alerts: ['keep'] });
  const initState = vi.fn(rootState);
  const writeState = vi.fn();

  createReset({
    initState,
    readState: () => {
      return current;
    },
    writeState,
  })({
    excluded: ['users', 'auth', 'alerts'],
  });
  expect(initState.mock.calls).toEqual([[]]);
  expect(writeState).toHaveBeenCalledExactlyOnceWith(current);
  expect(writeState.mock.calls[0][0]).not.toBe(current);
});

test('reports a factory failure without publishing or throwing', () => {
  const failure = new Error('factory failed');
  const writeState = vi.fn();
  const onError = vi.fn();
  const reset = createReset({
    initState: () => {
      throw failure;
    },
    readState: () => {
      return {};
    },
    writeState,
    onError,
  });

  expect(() => {
    return reset();
  }).not.toThrow();
  expect(onError).toHaveBeenCalledExactlyOnceWith({
    kind: 'reset',
    error: failure,
  });
  expect(writeState).not.toHaveBeenCalled();
});

test('reports a read failure without publishing or throwing', () => {
  const failure = new Error('read failed');
  const writeState = vi.fn();
  const onError = vi.fn();
  const reset = createReset({
    initState: rootState,
    readState: () => {
      throw failure;
    },
    writeState,
    onError,
  });

  expect(() => {
    return reset({ excluded: ['auth'] });
  }).not.toThrow();
  expect(onError).toHaveBeenCalledExactlyOnceWith({
    kind: 'reset',
    error: failure,
  });
  expect(writeState).not.toHaveBeenCalled();
});

test.each([
  { current: { users: [] }, initial: {}, key: 'users' },
  { current: {}, initial: { users: [] }, key: 'users' },
  { current: {}, initial: {}, key: 'unknown' },
  { current: {}, initial: {}, key: 'toString' },
])(
  'skips excluded keys absent from either root: %j',
  ({ current, initial, key }) => {
    const writeState = vi.fn();
    const reset = createReset({
      initState: () => {
        return initial;
      },
      readState: () => {
        return current;
      },
      writeState,
    });

    Reflect.apply(reset, undefined, [{ excluded: [key] }]);

    expect(writeState).toHaveBeenCalledExactlyOnceWith(initial);
  },
);

test('preserves available scopes while skipping missing and inherited keys', () => {
  const current = rootState({ auth: { token: 'session' }, alerts: ['old'] });
  const initial = Object.freeze(rootState());
  const writeState = vi.fn();
  const reset = createReset({
    initState: () => {
      return initial;
    },
    readState: () => {
      return current;
    },
    writeState,
  });

  Reflect.apply(reset, undefined, [
    { excluded: ['missing', 'auth', 'toString'] },
  ]);

  expect(writeState).toHaveBeenCalledExactlyOnceWith({
    users: { errors: [] },
    auth: { token: 'session' },
    alerts: [],
  });
  expect(writeState.mock.calls[0][0].auth).toBe(current.auth);
  expect(initial.auth.token).toBe('');
  expect(current.alerts).toEqual(['old']);
});

test.each([true, false])(
  'skips an optional scope absent from one root (current has scope: %j)',
  (hasCurrentScope) => {
    type State = { auth: string; debug?: boolean };

    const current: State = hasCurrentScope
      ? { auth: 'session', debug: true }
      : { auth: 'session' };
    const initial: State = hasCurrentScope
      ? { auth: '' }
      : { auth: '', debug: false };
    const writeState = vi.fn();
    const reset = createReset({
      initState: () => {
        return initial;
      },
      readState: () => {
        return current;
      },
      writeState,
    });

    reset({ excluded: ['debug', 'auth'] });

    expect(writeState).toHaveBeenCalledExactlyOnceWith(
      hasCurrentScope ? { auth: 'session' } : { auth: 'session', debug: false },
    );
  },
);

test('resets reshaped roots while preserving only valid scopes', () => {
  const old = { users: ['Ada'], debug: true };
  const writeState = vi.fn();
  const reset = createReset({
    initState: () => {
      return { users: [] as string[], auth: '' };
    },
    readState: () => {
      return old;
    },
    writeState,
  });

  reset({ excluded: ['users'] });
  expect(writeState).toHaveBeenLastCalledWith({ users: ['Ada'], auth: '' });
  reset();
  expect(writeState).toHaveBeenLastCalledWith({ users: [], auth: '' });
});

test('preserves own numeric, symbol and __proto__ keys without changing the prototype', () => {
  const symbol = Symbol('scope');
  const current = {
    7: ['old'],
    [symbol]: { value: 1 },
    ['__proto__']: { preserved: true },
    resettable: 8,
  };
  const initial = {
    7: [] as string[],
    [symbol]: { value: 0 },
    ['__proto__']: { preserved: false },
    resettable: 0,
  };
  const writeState = vi.fn();

  createReset({
    initState: () => {
      return initial;
    },
    readState: () => {
      return current;
    },
    writeState,
  })({ excluded: [7, symbol, '__proto__'] });

  const result = writeState.mock.calls[0][0];

  expect(result[7]).toBe(current[7]);
  expect(result[symbol]).toBe(current[symbol]);
  expect(result.__proto__).toBe(current.__proto__);
  expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  expect(result.resettable).toBe(0);
});

test.each([
  0,
  null,
  [1],
  () => {
    return 1;
  },
])(
  'supports full reset but rejects excluded keys for non-record %j',
  (initial) => {
    const writeState = vi.fn();
    const onError = vi.fn();
    const reset = createReset({
      initState: () => {
        return initial;
      },
      readState: () => {
        return initial;
      },
      writeState,
      onError,
    });

    reset();
    reset({ excluded: [] });
    expect(writeState).toHaveBeenCalledTimes(2);
    expect(() => {
      return Reflect.apply(reset, undefined, [{ excluded: ['length'] }]);
    }).not.toThrow();
    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'reset',
      error: expect.any(TypeError),
    });
    expect(writeState).toHaveBeenCalledTimes(2);
  },
);

const checkResetTypes = (
  record: Reset<ReturnType<typeof rootState>>,
  union: Reset<
    { kind: 'users'; users: string[] } | { kind: 'auth'; auth: string }
  >,
  primitive: Reset<number>,
  array: Reset<readonly string[]>,
  fn: Reset<() => void>,
  nested: Reset<{ scope: { kind: 'a' } | { kind: 'b' } }>,
) => {
  record({ excluded: ['auth', 'users'] as const });
  nested({ excluded: ['scope'] });
  union();
  union({ excluded: [] });
  primitive({ excluded: [] });
  // @ts-expect-error Unknown root key.
  record({ excluded: ['missing'] });
  // @ts-expect-error Union discriminator cannot be preserved separately.
  union({ excluded: ['kind'] });
  // @ts-expect-error Variant-specific key cannot be preserved.
  union({ excluded: ['users'] });
  // @ts-expect-error Primitive methods are not scope keys.
  primitive({ excluded: ['toFixed'] });
  // @ts-expect-error Array properties are not scopes.
  array({ excluded: ['length'] });
  // @ts-expect-error Function properties are not scopes.
  fn({ excluded: ['name'] });
};

test('checks reset contracts at compile time', () => {
  expectTypeOf(checkResetTypes).toBeFunction();
});

test('reports write failures through the reset error channel', () => {
  const failure = new Error('write failed');
  const failures: ResetError[] = [];
  const reset = createReset({
    initState: rootState,
    readState: rootState,
    writeState: () => {
      throw failure;
    },
    onError: (error) => {
      failures.push(error);
    },
  });

  expect(() => {
    return reset();
  }).not.toThrow();
  expect(failures).toEqual([{ kind: 'reset', error: failure }]);
});

test('reports malformed reset options instead of throwing during destructuring', () => {
  const initState = vi.fn(rootState);
  const writeState = vi.fn();
  const onError = vi.fn();
  const reset = createReset({
    initState,
    readState: rootState,
    writeState,
    onError,
  });

  expect(() => {
    return Reflect.apply(reset, undefined, [null]);
  }).not.toThrow();
  expect(onError).toHaveBeenCalledExactlyOnceWith({
    kind: 'reset',
    error: expect.any(TypeError),
  });
  expect(initState).not.toHaveBeenCalled();
  expect(writeState).not.toHaveBeenCalled();
});

test('uses the default reporter when no reset error handler is supplied', () => {
  const failure = new Error('factory failed');
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  const reset = createReset({
    initState: () => {
      throw failure;
    },
    readState: rootState,
    writeState: () => {},
  });

  try {
    expect(() => {
      return reset();
    }).not.toThrow();
    expect(logged).toHaveBeenCalledExactlyOnceWith({
      kind: 'reset',
      error: failure,
    });
  } finally {
    logged.mockRestore();
  }
});

test('uses the reporter fallback when a reset error handler itself throws', () => {
  const failure = new Error('factory failed');
  const handlerFailure = new Error('handler failed');
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  const reset = createReset({
    initState: () => {
      throw failure;
    },
    readState: rootState,
    writeState: () => {},
    onError: () => {
      throw handlerFailure;
    },
  });

  try {
    expect(() => {
      return reset();
    }).not.toThrow();
    expect(logged).toHaveBeenCalledExactlyOnceWith('Error handler failed', {
      failure: { kind: 'reset', error: failure },
      error: handlerFailure,
    });
  } finally {
    logged.mockRestore();
  }
});
