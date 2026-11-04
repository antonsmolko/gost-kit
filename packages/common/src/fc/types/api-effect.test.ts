import { expect, expectTypeOf, test } from 'vitest';
import { createApiClient } from '../../api';
import { createApiHandler } from '../lib/create-api-handler';
import type { ApiEffect } from './api-effect';
import type { TestPaths, TestUser } from '../../api/types/api-request.test';

type Action = { type: 'DoneAction' };

const checkEffectTypes = () => {
  const fallback = { code: 'FAILED', message: 'Failed', path: [] };
  const post: ApiEffect<TestPaths, Action> = {
    type: 'ApiEffect',
    method: 'post',
    url: '/users/{id}',
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    defaultError: fallback,
    onSuccess: (data) => {
      expectTypeOf(data).toEqualTypeOf<TestUser>();

      return { type: 'DoneAction' };
    },
  };
  const empty: ApiEffect<TestPaths, Action> = {
    type: 'ApiEffect',
    method: 'delete',
    url: '/empty',
    defaultError: fallback,
    onSuccess: (data) => {
      expectTypeOf(data).toEqualTypeOf<undefined>();

      return { type: 'DoneAction' };
    },
  };
  const wrong: ApiEffect<TestPaths, Action> = {
    ...post,
    // @ts-expect-error response must correspond to the selected endpoint
    onSuccess: (_data: string) => {
      return { type: 'DoneAction' };
    },
  };
  const handler = createApiHandler<TestPaths, Action>(
    createApiClient<TestPaths>({ baseUrl: 'https://example.test' }),
  );

  void handler.ApiEffect({ effect: empty, dispatch: async () => {} });
  void handler.ApiEffect({
    // @ts-expect-error effect type is not supported by this handler
    effect: { type: 'OtherEffect' },
    dispatch: async () => {},
  });

  // @ts-expect-error required request body must not disappear in effect union
  const missingBody: ApiEffect<TestPaths, Action> = {
    type: 'ApiEffect',
    method: 'post',
    url: '/users/{id}',
    params: { path: { id: 1 } },
    defaultError: fallback,
  };

  return [post, empty, wrong, missingBody];
};

test('effect type assertions are checked by tsc', () => {
  expect(checkEffectTypes).toBeTypeOf('function');
});
