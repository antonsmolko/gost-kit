import type { ApiClient } from './store/types/effect';

export const fakeApi: ApiClient = async ({ body }) => {
  await new Promise<void>((resolve) => setTimeout(resolve, 400));
  if (body.email === 'error@example.test') throw new Error('Synthetic API failure');
  return { id: '1', name: 'Ada Lovelace', email: body.email };
};
