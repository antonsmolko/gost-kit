import { expect, expectTypeOf, test } from 'vitest';
import { createApiClient } from '../lib/create-api-client';

interface ReadUserOperation {
  responses: { 200: { content: { 'application/json': TestUser } } };
}

export type TestUser = { id: number; name: string };
export type TestPaths = {
  '/users/{id}': {
    get: {
      parameters: { path: { id: number }; query?: { active?: boolean } };
      responses: { 200: { content: { 'application/json': TestUser | null } } };
    };
    post: {
      parameters: { path: { id: number } };
      requestBody: { content: { 'application/json': { name: string } } };
      responses: { 201: { content: { 'application/json': TestUser } } };
    };
  };
  '/empty': { delete: { responses: { 204: { content?: never } } } };
  '/interface': { get: ReadUserOperation };
  '/vendor': { get: { responses: { 200: { content: { 'application/vnd.example+json': TestUser } } } } };
  '/head-json': { head: { responses: { 200: { content: { 'application/json': TestUser } } } } };
  '/health': { head: { responses: { 200: { content?: never } } } };
};

const checkRequestTypes = async () => {
  const api = createApiClient<TestPaths>({ baseUrl: 'https://example.test' });
  const result = await api.request('get', '/users/{id}', {
    params: { path: { id: 1 } },
  });

  if (result.type === 'ok') {
    expectTypeOf(result.data).toEqualTypeOf<TestUser | null>();
  }

  const byInterface = await api.request('get', '/interface');

  if (byInterface.type === 'ok') {
    expectTypeOf(byInterface.data).toEqualTypeOf<TestUser>();
  }

  const vendor = await api.request('get', '/vendor');

  if (vendor.type === 'ok') {
    expectTypeOf(vendor.data).toEqualTypeOf<TestUser>();
  }

  const empty = await api.request('delete', '/empty');

  if (empty.type === 'ok') {
    expectTypeOf(empty.data).toEqualTypeOf<undefined>();
  }

  const head = await api.request('head', '/health');

  if (head.type === 'ok') {
    expectTypeOf(head.data).toEqualTypeOf<undefined>();
  }

  const headWithSchema = await api.request('head', '/head-json');

  if (headWithSchema.type === 'ok') {
    expectTypeOf(headWithSchema.data).toEqualTypeOf<undefined>();
  }

  // @ts-expect-error unknown route
  api.request('get', '/missing');
  // @ts-expect-error method not declared on route
  api.request('get', '/empty');
  // @ts-expect-error required path params
  api.request('get', '/users/{id}');
  // @ts-expect-error invalid path type
  api.request('get', '/users/{id}', { params: { path: { id: 'one' } } });
  // @ts-expect-error required body
  api.request('post', '/users/{id}', { params: { path: { id: 1 } } });
  // @ts-expect-error invalid body type
  api.request('post', '/users/{id}', { params: { path: { id: 1 } }, body: { name: 1 } });
  // @ts-expect-error no response type override
  api.request<TestUser>('delete', '/empty');
  // @ts-expect-error JSON-only response contract
  api.request('get', '/users/{id}', { params: { path: { id: 1 } }, parseAs: 'text' });
  // @ts-expect-error obsolete object-style client call
  api.request({ method: 'delete', url: '/empty' });
};

test('request type assertions are checked by tsc without executing requests', () => {
  expect(checkRequestTypes).toBeTypeOf('function');
});
