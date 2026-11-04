import { createApiClient, guard } from '@gost-kit/common';
import type { Paths } from './api/paths';

export const fakeApi = createApiClient<Paths>({
  baseUrl: 'https://synthetic.invalid',
  fetch: async (request) => {
    await new Promise<void>((resolve) => {
      return setTimeout(resolve, 400);
    });

    const body: unknown = await request.json();

    if (!guard.record(body) || !guard.string(body.email)) {
      throw new Error('Invalid synthetic request');
    }

    if (body.email === 'error@example.test') {
      throw new Error('Synthetic API failure');
    }

    return Response.json({ id: '1', name: 'Ada Lovelace', email: body.email });
  },
});
