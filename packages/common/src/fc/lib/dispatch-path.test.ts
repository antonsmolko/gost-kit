import { expect, test, vi } from 'vitest';
import { createDispatch } from './dispatch';

test.each([2, 'Ada', false, null, ['1', '2'], { email: 'ada@example.test' }])(
  'passes the payload unchanged to the selected action: %j',
  async (payload) => {
    const reducer = vi.fn(
      (
        _state: number,
        _action: {
          scope: 'users';
          type: 'SetAction';
          payload: typeof payload;
        },
      ) => {
        return { state: 1, effects: [] };
      },
    );
    const writeState = vi.fn();
    const dispatch = createDispatch<
      number,
      { scope: 'users'; type: 'SetAction'; payload: typeof payload },
      never
    >({
      readState: () => {
        return 0;
      },
      writeState,
      reducer,
      effector: async () => {},
    });

    await dispatch('users/SetAction', payload);

    expect(reducer).toHaveBeenCalledWith(0, {
      scope: 'users',
      type: 'SetAction',
      payload,
    });
    expect(reducer.mock.calls[0]?.[1]?.payload).toBe(payload);
    expect(writeState).toHaveBeenCalledWith(1);
  },
);

test('distinguishes absent payload from explicitly passed undefined', async () => {
  const received: object[] = [];
  const dispatch = createDispatch<
    number,
    { type: 'LoadAction' } | { type: 'SetAction'; payload: undefined },
    never
  >({
    readState: () => {
      return 0;
    },
    writeState: () => {},
    reducer: (state, action) => {
      received.push(action);

      return { state, effects: [] };
    },
    effector: async () => {},
  });

  await dispatch('root/LoadAction');
  await dispatch('root/SetAction', undefined);

  expect(received).toEqual([
    { scope: 'root', type: 'LoadAction' },
    { scope: 'root', type: 'SetAction', payload: undefined },
  ]);
  expect(Object.hasOwn(received[0], 'payload')).toBe(false);
  expect(Object.hasOwn(received[1], 'payload')).toBe(true);
});

test.each([
  undefined,
  null,
  42,
  '',
  'users',
  '/LoadAction',
  'users/',
  'users/a/b',
])(
  'reports invalid path %j before reading or committing state',
  async (path) => {
    const readState = vi.fn(() => {
      return 0;
    });
    const writeState = vi.fn();
    const reducer = vi.fn(() => {
      return { state: 1, effects: [] };
    });
    const effector = vi.fn(async () => {});
    const onError = vi.fn();
    const dispatch = createDispatch<number, { type: 'LoadAction' }, never>({
      readState,
      writeState,
      reducer,
      effector,
      onError,
    });

    // @ts-expect-error Exercise untyped callers at the runtime boundary.
    await dispatch(path);

    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'dispatch',
      path,
      error: expect.any(TypeError),
    });
    expect(readState).not.toHaveBeenCalled();
    expect(reducer).not.toHaveBeenCalled();
    expect(writeState).not.toHaveBeenCalled();
    expect(effector).not.toHaveBeenCalled();
  },
);
