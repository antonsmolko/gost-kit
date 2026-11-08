import { createApiClient, guard, type AsyncFn } from '@gost-kit/common';
import type { UserDto } from '../features/user/data/dto/user-dto';
import type { ApiClient } from '../store/types/effect';
import type { Paths } from './paths';

export const createSyntheticApi = (
  operation: AsyncFn<[Pick<UserDto, 'email'>], UserDto>,
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
