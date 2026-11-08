import { expect, test, vi } from 'vitest';
import { createApiClient } from './create-api-client';
import type { TestPaths } from '../types/api-client.test';

const user = { id: 1, name: 'Ada' };
const get = [
  'get',
  '/users/{id}',
  { params: { path: { id: 1 }, query: { active: true } } },
] as const;
const setup = (response: Response) => {
  const fetch = vi.fn(async (_request: Request) => {
    return response;
  });

  return {
    fetch,
    api: createApiClient<TestPaths>({
      baseUrl: 'https://example.test/api',
      fetch,
    }),
  };
};

test('GET serializes typed path/query and returns centrally parsed data', async () => {
  const { api, fetch } = setup(Response.json(user));

  expect(await api.request(...get)).toEqual({ type: 'ok', data: user });

  const request = fetch.mock.calls[0][0];

  expect(request.url).toBe('https://example.test/api/users/1?active=true');
  expect(request.method).toBe('GET');
});

test('POST sends body and explicitly configured headers', async () => {
  const { api, fetch } = setup(Response.json(user, { status: 201 }));

  await api.request('post', '/users/{id}', {
    params: { path: { id: 1 } },
    body: { name: 'Ada' },
    headers: { 'X-Test': 'yes' },
  });

  const request = fetch.mock.calls[0][0];

  expect(request.method).toBe('POST');
  expect(await request.json()).toEqual({ name: 'Ada' });
  expect(request.headers.get('X-Test')).toBe('yes');
});

test('204 and HEAD succeed with undefined and JSON null remains null', async () => {
  expect(
    await setup(new Response(null, { status: 204 })).api.request(
      'delete',
      '/empty',
    ),
  ).toEqual({ type: 'ok', data: undefined });
  expect(
    await setup(new Response(null)).api.request('head', '/health'),
  ).toEqual({ type: 'ok', data: undefined });
  expect(await setup(Response.json(null)).api.request(...get)).toEqual({
    type: 'ok',
    data: null,
  });
});

test.each([
  ['JSON', Response.json({ message: 'Forbidden' }, { status: 403 })],
  ['text', new Response('Bad gateway', { status: 502 })],
  ['empty', new Response(null, { status: 401 })],
])(
  'HTTP %s errors preserve HTTP classification before success validation',
  async (_name, response) => {
    expect(await setup(response).api.request(...get)).toEqual({
      type: 'error',
      error: { kind: 'http', status: response.status, errors: [] },
    });
  },
);

test('custom error mapping runs once centrally with parsed error and response', async () => {
  const errors = [{ code: 'NAME', message: 'Invalid name', path: ['name'] }];
  const response = Response.json({ fields: ['name'] }, { status: 422 });
  const mapErrors = vi.fn(() => {
    return errors;
  });
  const api = createApiClient<TestPaths>({
    baseUrl: 'https://example.test',
    fetch: async () => {
      return response;
    },
    mapErrors,
  });

  expect(await api.request(...get)).toEqual({
    type: 'error',
    error: { kind: 'http', status: 422, errors },
  });
  expect(mapErrors).toHaveBeenCalledExactlyOnceWith(
    { fields: ['name'] },
    response,
  );
});

test('error mapper exceptions propagate without becoming network failures', async () => {
  const error = new Error('Mapper bug');
  const api = createApiClient<TestPaths>({
    baseUrl: 'https://example.test',
    fetch: async () => {
      return new Response(null, { status: 500 });
    },
    mapErrors: () => {
      throw error;
    },
  });

  await expect(api.request(...get)).rejects.toBe(error);
});

test.each([
  ['network', new TypeError('Failed to fetch')],
  ['network', null],
  ['aborted', new DOMException('Aborted', 'AbortError')],
  ['aborted', new DOMException('Timeout', 'TimeoutError')],
  ['contract', new SyntaxError('Invalid JSON')],
])(
  'transport rejection is normalized as %s without retaining raw data',
  async (kind, reason) => {
    const api = createApiClient<TestPaths>({
      baseUrl: 'https://example.test',
      fetch: async () => {
        throw reason;
      },
    });

    expect(await api.request(...get)).toEqual({
      type: 'error',
      error: { kind, errors: [] },
    });
  },
);

test.each([
  new Response('{broken', { headers: { 'Content-Type': 'application/json' } }),
  new Response('{}', { headers: { 'Content-Type': 'text/plain' } }),
  new Response(null, { headers: { 'Content-Type': 'application/json' } }),
])('invalid/missing JSON response is a contract failure', async (response) => {
  const result = await setup(response).api.request(...get);

  expect(result.type).toBe('error');

  if (result.type === 'error') {
    expect(result.error.kind).toBe('contract');
  }
});

test('JSON media suffix is supported and the response is read only once', async () => {
  const response = new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/vnd.example+json; charset=utf-8' },
  });

  expect(await setup(response).api.request(...get)).toEqual({
    type: 'ok',
    data: user,
  });
  expect(response.bodyUsed).toBe(true);
});

test('signal explains rejection but cannot override a resolved success', async () => {
  const controller = new AbortController();

  controller.abort();

  const options = { ...get[2], signal: controller.signal };
  const rejected = createApiClient<TestPaths>({
    baseUrl: 'https://example.test',
    fetch: async () => {
      throw new Error('Stopped');
    },
  });

  expect(await rejected.request(get[0], get[1], options)).toEqual({
    type: 'error',
    error: { kind: 'aborted', errors: [] },
  });
  expect(
    await setup(Response.json(user)).api.request(get[0], get[1], options),
  ).toEqual({ type: 'ok', data: user });
});

test('clients keep independent configuration and no browser origin is needed', async () => {
  const a = setup(Response.json(user));
  const b = setup(Response.json(null));

  expect(await a.api.request(...get)).toEqual({ type: 'ok', data: user });
  expect(await b.api.request(...get)).toEqual({ type: 'ok', data: null });
});

test.each(['application/json', 'text/plain'])(
  'combined Content-Type after parameters remains a contract failure: %s',
  async (second) => {
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
    });

    headers.append('Content-Type', second);

    const response = new Response(JSON.stringify(user), { headers });

    expect(await setup(response).api.request(...get)).toEqual({
      type: 'error',
      error: { kind: 'contract', status: 200, errors: [] },
    });
  },
);
