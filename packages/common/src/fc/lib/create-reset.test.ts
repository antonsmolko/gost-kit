import { expect, expectTypeOf, test, vi } from 'vitest';
import { createReset } from './create-reset';
import { define } from './define';
import type { Reset } from '../types/reset';

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

test('creates fresh nested defaults on every reset without mutating prior state', () => {
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
  const fresh = Object.freeze(rootState());
  let state = previous;
  const writes: (typeof state)[] = [];
  const reset = createReset({
    initState: () => {
      return fresh;
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
  expect(state.users).toBe(fresh.users);
  expect(state).not.toBe(fresh);
  expect(fresh.auth.token).toBe('');
});

test.each([undefined, {}, { excluded: undefined }, { excluded: [] }])(
  'treats %j as a full reset',
  (options) => {
    const fresh = rootState();
    const writeState = vi.fn();
    const readState = vi.fn(() => {
      return rootState();
    });

    createReset({
      initState: () => {
        return fresh;
      },
      readState,
      writeState,
    })(options);
    expect(writeState).toHaveBeenCalledExactlyOnceWith(fresh);
  },
);

test.each([null, 'auth', '', {}, { length: 0 }, 7, false])(
  'rejects non-array excluded %j before executing state callbacks',
  (excluded) => {
    const initState = vi.fn(rootState);
    const readState = vi.fn(rootState);
    const writeState = vi.fn();
    const reset = createReset({ initState, readState, writeState });

    expect(() => {
      return Reflect.apply(reset, undefined, [{ excluded }]);
    }).toThrow(new TypeError('Reset excluded must be an array of root keys'));
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

test('leaves state untouched when the factory throws', () => {
  const failure = new Error('factory failed');
  const writeState = vi.fn();
  const reset = createReset({
    initState: () => {
      throw failure;
    },
    readState: () => {
      return {};
    },
    writeState,
  });

  expect(() => {
    return reset();
  }).toThrow(failure);
  expect(writeState).not.toHaveBeenCalled();
});

test('does not publish if reading current state fails', () => {
  const failure = new Error('read failed');
  const writeState = vi.fn();
  const reset = createReset({
    initState: rootState,
    readState: () => {
      throw failure;
    },
    writeState,
  });

  expect(() => {
    return reset({ excluded: ['auth'] });
  }).toThrow(failure);
  expect(writeState).not.toHaveBeenCalled();
});

test.each([
  { current: { users: [] }, fresh: {}, key: 'users' },
  { current: {}, fresh: { users: [] }, key: 'users' },
  { current: {}, fresh: {}, key: 'unknown' },
  { current: {}, fresh: {}, key: 'toString' },
])(
  'rejects excluded keys absent from either root: %j',
  ({ current, fresh, key }) => {
    const writeState = vi.fn();
    const reset = createReset({
      initState: () => {
        return fresh;
      },
      readState: () => {
        return current;
      },
      writeState,
    });

    expect(() => {
      return Reflect.apply(reset, undefined, [{ excluded: [key] }]);
    }).toThrow(TypeError);
    expect(writeState).not.toHaveBeenCalled();
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
  const fresh = {
    7: [] as string[],
    [symbol]: { value: 0 },
    ['__proto__']: { preserved: false },
    resettable: 0,
  };
  const writeState = vi.fn();

  createReset({
    initState: () => {
      return fresh;
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
  (fresh) => {
    const writeState = vi.fn();
    const reset = createReset({
      initState: () => {
        return fresh;
      },
      readState: () => {
        return fresh;
      },
      writeState,
    });

    reset();
    reset({ excluded: [] });
    expect(writeState).toHaveBeenCalledTimes(2);
    expect(() => {
      return Reflect.apply(reset, undefined, [{ excluded: ['length'] }]);
    }).toThrow(TypeError);
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
