import { createApiClient, guard, type AsyncFn } from '@gost-kit/common';
import type { User } from '../features/user/domain/entities/user';
import type { ApiClient } from '../store/types/effect';
import type { Paths } from './paths';

export const createTestApi = (
  operation: AsyncFn<[{ email: string }], User>,
): ApiClient => {
  return createApiClient<Paths>({
    baseUrl: 'https://synthetic.invalid',
    fetch: async (request) => {
      const body: unknown = await request.json();

      if (!guard.record(body) || !guard.string(body.email)) {
        throw new Error('Invalid synthetic request');
      }

      return Response.json(await operation({ email: body.email }));
    },
  });
};
