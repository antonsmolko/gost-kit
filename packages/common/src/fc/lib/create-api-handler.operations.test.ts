import { expect, expectTypeOf, test, vi } from 'vitest';
import {
  createApiClient,
  defineApiOperation,
  type ApiFailure,
} from '../../api';
import type { AppError } from '../../app-error';
import type { TestPaths, TestUser } from '../../api/types/api-request.test';
import { createApiEffect } from './create-api-effect';
import { createApiHandler } from './create-api-handler';
import { effecting } from './effecting';
import type { ApiEffect } from '../types/api-effect';

const fallback: AppError = {
  code: 'LOAD',
  message: 'Could not load',
  path: [],
};

type SuccessAction = { type: 'LoadedAction'; label: string };
type ErrorAction = {
  type: 'FailedAction';
  errors: AppError[];
  failure: ApiFailure;
};
type Action = SuccessAction | ErrorAction;

const request = {
  params: { path: { id: 1 } },
  body: { name: 'Ada' },
  defaultError: fallback,
};
const onError = (errors: AppError[], failure: ApiFailure): Action => {
  return { type: 'FailedAction', errors, failure };
};
const setup = <TMap extends (dto: TestUser) => unknown>(
  mapResponse: TMap,
  fetch: typeof globalThis.fetch = async () => {
    return Response.json({ id: 1, name: 'Ada' });
  },
  mapErrors?: () => AppError[],
) => {
  const operation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
    mapResponse,
  });
  const api = createApiClient<TestPaths>({
    baseUrl: 'https://example.test',
    fetch,
    mapErrors,
  });

  return {
    operation,
    api,
    handler: createApiHandler<TestPaths, Action, typeof operation>(api),
  };
};

test('shared effector maps DTO and dispatches a domain action without leaking effect metadata', async () => {
  const seen: Request[] = [];
  const { operation, handler, api } = setup(
    (dto) => {
      return { label: dto.name.toUpperCase() };
    },
    async (input, init) => {
      // createApiClient calls fetch with a Request; it must contain only HTTP options.
      expect(init).toBeUndefined();
      expect(input).toBeInstanceOf(Request);
      seen.push(new Request(input));

      return Response.json({ id: 1, name: 'Ada' });
    },
  );
  const invoke = vi.spyOn(api, 'request');
  const dispatch = vi.fn(async () => {});
  const effect = createApiEffect(operation, {
    ...request,
    onSuccess: (user) => {
      return { type: 'LoadedAction', label: user.label };
    },
  });
  const effector = effecting<
    Action,
    ApiEffect<typeof operation, SuccessAction, ErrorAction>,
    readonly [typeof handler]
  >(handler);

  await effector(effect, dispatch);
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'LoadedAction',
    label: 'ADA',
  });
  expect(invoke).toHaveBeenCalledExactlyOnceWith('post', '/users/{id}', {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
  });
  expect(seen[0].url).toBe('https://example.test/users/1');
  expect(await seen[0].json()).toEqual({ name: 'Ada' });
});

test.each(['sync', 'async'] as const)(
  '%s mapper failure reaches onError with contract kind and defaultError',
  async (mode) => {
    const problem = new Error('Unexpected DTO');
    const mapper = vi.fn((_dto: TestUser) => {
      if (mode === 'async') {
        return Promise.reject(problem);
      }
      throw problem;
    });
    const mapErrors = vi.fn(() => {
      return [];
    });
    const { operation, handler } = setup(mapper, undefined, mapErrors);
    const success = vi.fn(() => {
      return { type: 'LoadedAction' as const, label: '' };
    });
    const dispatch = vi.fn(async () => {});

    await handler.ApiEffect({
      effect: createApiEffect(operation, {
        ...request,
        onSuccess: success,
        onError,
      }),
      dispatch,
    });
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'FailedAction',
      errors: [fallback],
      failure: { kind: 'contract', errors: [] },
    });
    expect(success).not.toHaveBeenCalled();
    expect(mapErrors).not.toHaveBeenCalled();
  },
);

test('mapper executes without onSuccess and rejects failure without onError', async () => {
  const mapper = vi.fn((_dto: TestUser) => {
    throw new Error('Unexpected DTO');
  });
  const { operation, handler } = setup(mapper);
  const dispatch = vi.fn(async () => {});

  await handler.ApiEffect({
    effect: createApiEffect(operation, { ...request, onError }),
    dispatch,
  });
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'FailedAction',
    errors: [fallback],
    failure: { kind: 'contract', errors: [] },
  });
  await expect(
    handler.ApiEffect({
      effect: createApiEffect(operation, request),
      dispatch,
    }),
  ).rejects.toEqual({ kind: 'contract', errors: [] });
  expect(mapper).toHaveBeenCalledTimes(2);
});

test.each(['http', 'network', 'aborted', 'contract'] as const)(
  '%s transport failure skips mapper and preserves classification',
  async (kind) => {
    const mapper = vi.fn((dto: TestUser) => {
      return dto;
    });
    const { operation, handler } = setup(mapper, async () => {
      if (kind === 'network') {
        throw new TypeError('Offline');
      }

      if (kind === 'aborted') {
        throw new DOMException('Cancelled', 'AbortError');
      }

      if (kind === 'contract') {
        return new Response('null', {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      return new Response(null, { status: 503 });
    });
    const dispatch = vi.fn(async () => {});

    await handler.ApiEffect({
      effect: createApiEffect(operation, { ...request, onError }),
      dispatch,
    });
    expect(mapper).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'FailedAction',
      errors: [fallback],
      failure: {
        kind,
        ...(kind === 'http'
          ? { status: 503 }
          : kind === 'contract'
            ? { status: 200 }
            : {}),
        errors: [],
      },
    });
  },
);

test('http AppErrors are retained instead of defaultError', async () => {
  const errors: AppError[] = [
    { code: 'EMAIL', message: 'Invalid email', path: ['email'] },
  ];
  const { operation, handler } = setup(
    (dto) => {
      return dto;
    },
    async () => {
      return new Response(null, { status: 422 });
    },
    () => {
      return errors;
    },
  );
  const dispatch = vi.fn(async () => {});

  await handler.ApiEffect({
    effect: createApiEffect(operation, { ...request, onError }),
    dispatch,
  });
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'FailedAction',
    errors,
    failure: { kind: 'http', status: 422, errors },
  });
});

test('async mapper completes before success and dispatch is awaited', async () => {
  const events: string[] = [];
  const { operation, handler } = setup(async (dto) => {
    await Promise.resolve();
    events.push('mapped');

    return { label: dto.name };
  });

  await handler.ApiEffect({
    effect: createApiEffect(operation, {
      ...request,
      onSuccess: (user) => {
        events.push('success');

        return { type: 'LoadedAction', label: user.label };
      },
    }),
    dispatch: async () => {
      await Promise.resolve();
      events.push('dispatched');
    },
  });
  events.push('done');
  expect(events).toEqual(['mapped', 'success', 'dispatched', 'done']);
});

test.each(['success', 'error', 'dispatch'] as const)(
  '%s exception is not converted into a mapper failure',
  async (phase) => {
    const problem = new Error('Callback failed');
    const errors = vi.fn(onError);
    const { operation, handler } = setup(
      (dto) => {
        return { label: dto.name };
      },
      async () => {
        return phase === 'error'
          ? new Response(null, { status: 500 })
          : Response.json({ id: 1, name: 'Ada' });
      },
    );

    await expect(
      handler.ApiEffect({
        effect: createApiEffect(operation, {
          ...request,
          onSuccess: (user) => {
            if (phase === 'success') {
              throw problem;
            }

            return { type: 'LoadedAction', label: user.label };
          },
          onError:
            phase === 'error'
              ? () => {
                  throw problem;
                }
              : errors,
        }),
        dispatch: async () => {
          throw problem;
        },
      }),
    ).rejects.toBe(problem);
    expect(errors).not.toHaveBeenCalled();
  },
);

test('identity operations preserve null, 204 and HEAD undefined', async () => {
  const api = createApiClient<TestPaths>({
    baseUrl: 'https://example.test',
    fetch: async (input) => {
      const req = new Request(input);

      return req.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : req.method === 'HEAD'
          ? new Response(null)
          : Response.json(null);
    },
  });
  const get = defineApiOperation<TestPaths>()({
    method: 'get',
    url: '/users/{id}',
  });
  const empty = defineApiOperation<TestPaths>()({
    method: 'delete',
    url: '/empty',
  });
  const head = defineApiOperation<TestPaths>()({
    method: 'head',
    url: '/head-json',
  });
  const handler = createApiHandler<
    TestPaths,
    Action,
    typeof get | typeof empty | typeof head
  >(api);
  const values: unknown[] = [];
  const done = (data: unknown): Action => {
    values.push(data);

    return { type: 'LoadedAction', label: 'done' };
  };
  const dispatch = async () => {};

  await handler.ApiEffect({
    effect: createApiEffect(get, {
      params: { path: { id: 1 } },
      defaultError: fallback,
      onSuccess: done,
    }),
    dispatch,
  });
  await handler.ApiEffect({
    effect: createApiEffect(empty, { defaultError: fallback, onSuccess: done }),
    dispatch,
  });
  await handler.ApiEffect({
    effect: createApiEffect(head, { defaultError: fallback, onSuccess: done }),
    dispatch,
  });
  expect(values).toEqual([null, undefined, undefined]);
});

const checkHandlerTypes = () => {
  const { operation, handler } = setup((dto) => {
    return { label: dto.name };
  });
  const effect = createApiEffect(operation, {
    ...request,
    onSuccess: (user) => {
      expectTypeOf(user).toEqualTypeOf<{ label: string }>();

      return { type: 'LoadedAction', label: user.label };
    },
  });

  void handler.ApiEffect({ effect, dispatch: async () => {} });

  const invalid = createApiEffect(operation, {
    ...request,
    onSuccess: () => {
      return { type: 'OtherAction' };
    },
  });

  // @ts-expect-error handler must enforce RootAction
  void handler.ApiEffect({ effect: invalid, dispatch: async () => {} });
};

test('direct handler type assertions are checked by tsc', () => {
  expect(checkHandlerTypes).toBeTypeOf('function');
});

test('successful mapper runs without success callback and skips dispatch', async () => {
  const mapper = vi.fn((dto: TestUser) => {
    return { label: dto.name };
  });
  const { operation, handler } = setup(mapper);
  const dispatch = vi.fn(async () => {});

  await handler.ApiEffect({
    effect: createApiEffect(operation, request),
    dispatch,
  });
  expect(mapper).toHaveBeenCalledExactlyOnceWith({ id: 1, name: 'Ada' });
  expect(dispatch).not.toHaveBeenCalled();
});

test('mapper AbortError is a contract failure even after a late abort', async () => {
  const controller = new AbortController();
  const { operation, handler } = setup((_dto) => {
    controller.abort();
    throw new DOMException('Mapper failed', 'AbortError');
  });
  const dispatch = vi.fn(async () => {});

  await handler.ApiEffect({
    effect: createApiEffect(operation, {
      ...request,
      signal: controller.signal,
      onError,
    }),
    dispatch,
  });
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'FailedAction',
    errors: [fallback],
    failure: { kind: 'contract', errors: [] },
  });
});

test('unexpected API client rejection bypasses mapper and API callbacks', async () => {
  const mapper = vi.fn((dto: TestUser) => {
    return dto;
  });
  const { operation, handler, api } = setup(mapper);
  const problem = new Error('Client implementation failed');

  vi.spyOn(api, 'request').mockRejectedValueOnce(problem);

  const error = vi.fn(onError);

  await expect(
    handler.ApiEffect({
      effect: createApiEffect(operation, { ...request, onError: error }),
      dispatch: async () => {},
    }),
  ).rejects.toBe(problem);
  expect(mapper).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});
