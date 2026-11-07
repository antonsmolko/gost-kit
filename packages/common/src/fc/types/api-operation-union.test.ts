import { expect, test } from 'vitest';
import {
  createApiClient,
  defineApiOperation,
  type ApiOperationDefinition,
} from '../../api';
import { createApiEffect } from '../lib/create-api-effect';
import { createApiHandler } from '../lib/create-api-handler';
import type { ApiEffect } from './api-effect';

type Paths = {
  '/search': {
    get: {
      parameters: { query: { term: string } };
      responses: { 200: { content: { 'application/json': string[] } } };
    };
  };
  '/status': {
    get: { responses: { 200: { content: { 'application/json': boolean } } } };
  };
};
type Action = { type: 'DoneAction' };

const fallback = { code: 'FAILED', message: 'Failed', path: [] };

const checkUnionTypes = (search: boolean) => {
  const definition: ApiOperationDefinition<Paths> = search
    ? { method: 'get', url: '/search' }
    : { method: 'get', url: '/status' };
  const operation = defineApiOperation<Paths>()(definition);
  // @ts-expect-error unresolved routes must be narrowed before constructing an effect
  const invalid = createApiEffect(operation, { defaultError: fallback });

  // @ts-expect-error factory does not accept unresolved unions even with one branch's params
  createApiEffect(operation, {
    params: { query: { term: 'Ada' } },
    defaultError: fallback,
  });

  const handler = createApiHandler<Paths, Action, typeof operation>(
    createApiClient<Paths>({ baseUrl: 'https://example.test' }),
  );

  void handler.ApiEffect({
    // @ts-expect-error manually constructed unresolved route must not bypass query enforcement
    effect: {
      type: 'ApiEffect',
      operation,
      method: operation.method,
      url: operation.url,
      defaultError: fallback,
    },
    dispatch: async () => {},
  });

  if (operation.url === '/search') {
    // @ts-expect-error narrowed route still requires query
    createApiEffect(operation, { defaultError: fallback });

    const effect: ApiEffect<typeof operation, Action, never> = createApiEffect(
      operation,
      { params: { query: { term: 'Ada' } }, defaultError: fallback },
    );

    void handler.ApiEffect({ effect, dispatch: async () => {} });
  } else {
    const effect = createApiEffect(operation, { defaultError: fallback });

    void handler.ApiEffect({ effect, dispatch: async () => {} });
  }

  return invalid;
};

test('unresolved definition unions cannot bypass required endpoint options', () => {
  expect(checkUnionTypes).toBeTypeOf('function');
});
