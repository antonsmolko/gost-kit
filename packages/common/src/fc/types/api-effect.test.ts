import { expect, expectTypeOf, test } from 'vitest';
import { createApiClient, defineApiOperation } from '../../api';
import { createApiEffector } from '../lib/create-api-effector';
import { createApiEffect } from '../lib/create-api-effect';
import type { ApiEffect } from './api-effect';
import type { TestPaths, TestUser } from '../../api/types/api-client.test';

type Action = { type: 'DoneAction' };

const checkEffectTypes = () => {
  const fallback = { code: 'FAILED', message: 'Failed', path: [] };
  const postOperation = defineApiOperation<TestPaths>()({
    method: 'post',
    url: '/users/{id}',
  });
  const emptyOperation = defineApiOperation<TestPaths>()({
    method: 'delete',
    url: '/empty',
  });

  type Operation = typeof postOperation | typeof emptyOperation;

  const post: ApiEffect<Operation, Action, never> = createApiEffect(
    postOperation,
    {
      params: { path: { id: 1 } },
      body: { name: 'Ada' },
      defaultError: fallback,
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<TestUser>();

        return { type: 'DoneAction' };
      },
    },
  );
  const empty: ApiEffect<Operation, Action, never> = createApiEffect(
    emptyOperation,
    {
      defaultError: fallback,
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<undefined>();

        return { type: 'DoneAction' };
      },
    },
  );
  const wrong: ApiEffect<Operation, Action, never> = {
    ...post,
    // @ts-expect-error response must correspond to the selected operation
    onSuccess: (_data: string) => {
      return { type: 'DoneAction' };
    },
  };
  const handler = createApiEffector<TestPaths, Action, Operation>(
    createApiClient<TestPaths>({ baseUrl: 'https://example.test' }),
  );

  void handler.ApiEffect({ effect: empty, dispatch: async () => {} });
  void handler.ApiEffect({
    // @ts-expect-error effect type is not supported by this handler
    effect: { type: 'OtherEffect' },
    dispatch: async () => {},
  });

  // @ts-expect-error required body must not disappear in effect union
  const missingBody: ApiEffect<Operation, Action, never> = {
    type: 'ApiEffect',
    operation: postOperation,
    method: 'post',
    url: '/users/{id}',
    params: { path: { id: 1 } },
    defaultError: fallback,
  };

  void handler.ApiEffect({
    // @ts-expect-error an API effect must carry its operation
    effect: {
      type: 'ApiEffect',
      method: 'post',
      url: '/users/{id}',
      params: { path: { id: 1 } },
      body: { name: 'Ada' },
      defaultError: fallback,
    },
    dispatch: async () => {},
  });

  const other = defineApiOperation<{
    '/other': {
      get: { responses: { 200: { content: { 'application/json': string } } } };
    };
  }>()({ method: 'get', url: '/other' });

  // @ts-expect-error handler operations belong to its client schema
  createApiEffector<TestPaths, Action, typeof other>(
    createApiClient<TestPaths>({ baseUrl: 'https://example.test' }),
  );

  return [post, empty, wrong, missingBody, other];
};

test('effect type assertions are checked by tsc', () => {
  expect(checkEffectTypes).toBeTypeOf('function');
});
