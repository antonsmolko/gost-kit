import { expect, test, vi } from 'vitest';
import { createApiClient, defineApiOperation } from '../../api';
import { createApiEffect } from './create-api-effect';
import { createApiHandler } from './create-api-handler';
import { effecting } from './effecting';
import type { AppError } from '../../app-error';
import type { TestPaths } from '../../api/types/api-request.test';
import type { ApiEffect } from '../types/api-effect';

type SuccessAction = { type: 'LoadedAction'; name: string };
type ErrorAction = { type: 'FailedAction'; errors: AppError[] };
type TestAction = SuccessAction | ErrorAction;

const fallback: AppError = {
  code: 'LOAD_FAILED',
  message: 'Could not load user',
  path: [],
};
const action: TestAction = { type: 'LoadedAction', name: 'Ada' };
const operation = defineApiOperation<TestPaths>()({
  method: 'post',
  url: '/users/{id}',
});
const effect: ApiEffect<typeof operation, SuccessAction, ErrorAction> =
  createApiEffect(operation, {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: (user) => {
      return { type: 'LoadedAction', name: user.name };
    },
    onError: (errors) => {
      return { type: 'FailedAction', errors };
    },
  });
const setup = (response: Response, mapErrors?: () => AppError[]) => {
  return createApiHandler<TestPaths, TestAction, typeof operation>(
    createApiClient<TestPaths>({
      baseUrl: 'https://example.test',
      fetch: async () => {
        return response;
      },
      mapErrors,
    }),
  );
};

test('handler composes with effecting and dispatches the typed success action', async () => {
  const dispatch = vi.fn(async () => {});
  const effector = effecting<
    TestAction,
    ApiEffect<typeof operation, SuccessAction, ErrorAction>,
    readonly [ReturnType<typeof setup>]
  >(setup(Response.json({ id: 1, name: 'Ada' })));

  await effector(effect, dispatch);
  expect(dispatch).toHaveBeenCalledExactlyOnceWith(action);
});

test('request errors dispatch defaultError, preserving failure classification', async () => {
  const dispatch = vi.fn(async () => {});
  const onError = vi.fn(effect.onError);

  await setup(new Response(null, { status: 503 })).ApiEffect({
    effect: { ...effect, onError },
    dispatch,
  });
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'FailedAction',
    errors: [fallback],
  });
  expect(onError).toHaveBeenCalledWith([fallback], {
    kind: 'http',
    status: 503,
    errors: [],
  });
});

test('mapped AppErrors replace the fallback', async () => {
  const errors: AppError[] = [
    { code: 'NAME', message: 'Invalid name', path: ['name'] },
  ];
  const dispatch = vi.fn(async () => {});

  await setup(new Response(null, { status: 422 }), () => {
    return errors;
  }).ApiEffect({ effect, dispatch });
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'FailedAction',
    errors,
  });
});

test('missing onSuccess skips dispatch and missing onError rejects the failure', async () => {
  const dispatch = vi.fn(async () => {});

  await setup(Response.json({ id: 1, name: 'Ada' })).ApiEffect({
    effect: { ...effect, onSuccess: undefined },
    dispatch,
  });
  expect(dispatch).not.toHaveBeenCalled();
  await expect(
    setup(new Response(null, { status: 401 })).ApiEffect({
      effect: { ...effect, onError: undefined },
      dispatch,
    }),
  ).rejects.toEqual({ kind: 'http', status: 401, errors: [] });
});

test('success callback errors propagate without invoking onError', async () => {
  const error = new Error('Callback failed');
  const onError = vi.fn(effect.onError);

  await expect(
    setup(Response.json({ id: 1, name: 'Ada' })).ApiEffect({
      effect: {
        ...effect,
        onSuccess: () => {
          throw error;
        },
        onError,
      },
      dispatch: async () => {},
    }),
  ).rejects.toBe(error);
  expect(onError).not.toHaveBeenCalled();
});

test('error callback errors propagate exactly once', async () => {
  const error = new Error('Callback failed');
  const onError = vi.fn(() => {
    throw error;
  });

  await expect(
    setup(new Response(null, { status: 500 })).ApiEffect({
      effect: { ...effect, onError },
      dispatch: async () => {},
    }),
  ).rejects.toBe(error);
  expect(onError).toHaveBeenCalledTimes(1);
});

test('dispatch errors are not reclassified as request failures', async () => {
  const error = new Error('Dispatch failed');
  const onError = vi.fn(effect.onError);
  const dispatch = vi.fn(async () => {
    throw error;
  });

  await expect(
    setup(Response.json({ id: 1, name: 'Ada' })).ApiEffect({
      effect: { ...effect, onError },
      dispatch,
    }),
  ).rejects.toBe(error);
  expect(onError).not.toHaveBeenCalled();
  expect(dispatch).toHaveBeenCalledTimes(1);
});

test('client implementation exceptions propagate without invoking onError', async () => {
  const error = new Error('Client bug');
  const onError = vi.fn(effect.onError);
  const handler = createApiHandler<TestPaths, TestAction, typeof operation>({
    request: async () => {
      throw error;
    },
  });

  await expect(
    handler.ApiEffect({
      effect: { ...effect, onError },
      dispatch: async () => {},
    }),
  ).rejects.toBe(error);
  expect(onError).not.toHaveBeenCalled();
});

test('handler waits for the nested action dispatch', async () => {
  const completed = Promise.withResolvers<void>();
  let finished = false;
  const pending = setup(Response.json({ id: 1, name: 'Ada' }))
    .ApiEffect({
      effect,
      dispatch: () => {
        return completed.promise;
      },
    })
    .then(() => {
      finished = true;
    });

  await Promise.resolve();
  expect(finished).toBe(false);
  completed.resolve();
  await pending;
  expect(finished).toBe(true);
});

test('effect callbacks and fallback metadata never reach the injected client', async () => {
  const error = new Error('Stop after recording');
  const request = vi.fn(async () => {
    throw error;
  });
  const handler = createApiHandler<TestPaths, TestAction, typeof operation>({
    request,
  });

  await expect(
    handler.ApiEffect({ effect, dispatch: async () => {} }),
  ).rejects.toBe(error);

  expect(request).toHaveBeenCalledExactlyOnceWith('post', '/users/{id}', {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
  });
});
