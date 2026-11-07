import { createSyntheticApi } from './api/create-synthetic-api';

export const fakeApi = createSyntheticApi(async ({ email }) => {
  await new Promise<void>((resolve) => {
    return setTimeout(resolve, 400);
  });

  if (email === 'error@example.test') {
    throw new Error('Synthetic API failure');
  }

  return { user_id: 1, full_name: 'Ada Lovelace', email };
});
