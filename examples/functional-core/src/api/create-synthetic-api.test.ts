import { expect, test } from 'vitest';
import { createSyntheticApi } from './create-synthetic-api';

const user = { user_id: 1, full_name: 'Ada', email: 'ada@example.test' };

test('synthetic transport parses the email once and returns the operation result', async () => {
  const received: { email: string }[] = [];
  const api = createSyntheticApi(async (request) => {
    received.push(request);

    return user;
  });

  expect(
    await api.request('post', '/user', { body: { email: user.email } }),
  ).toEqual({ type: 'ok', data: user });
  expect(received).toEqual([{ email: user.email }]);
});

test.each([null, [], {}, { email: 42 }])(
  'invalid serialized payload never reaches the operation: %j',
  async (payload) => {
    let called = false;
    const api = createSyntheticApi(async () => {
      called = true;

      return user;
    });
    const result = await api.request('post', '/user', {
      body: { email: user.email },
      bodySerializer: () => {
        return JSON.stringify(payload);
      },
    });

    expect(result).toEqual({
      type: 'error',
      error: { kind: 'network', errors: [] },
    });
    expect(called).toBe(false);
  },
);
