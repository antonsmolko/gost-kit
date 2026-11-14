import { expect, test } from 'vitest';
import { createApiEffect } from '@gost-kit/common';
import { loadUser } from '../../features/user/data/api/load-user';
import { createEffector } from './effector';
import { createSyntheticApi } from '../../api/create-synthetic-api';
import type { ApiEffect } from '../types/effect';
import type { UserDto } from '../../features/user/data/dto/user-dto';

const user: UserDto = {
  user_id: 1,
  full_name: 'Ada',
  email: 'ada@example.test',
};
const effect: ApiEffect = createApiEffect(loadUser, {
  body: { email: user.email },
  defaultError: {
    code: 'USER_LOAD_FAILED',
    message: 'Could not load user',
    path: [],
  },
  onSuccess: (response) => {
    return {
      scope: 'users',
      type: 'SuccessReceiveAction',
      payload: { response },
    };
  },
  onError: (errors) => {
    return { scope: 'users', type: 'ErrorReceiveAction', payload: { errors } };
  },
});

test('request failure dispatches the configured default error', async () => {
  const actions: unknown[][] = [];
  const requests: { email: string }[] = [];
  const effector = createEffector(
    createSyntheticApi(async (request) => {
      requests.push(request);
      throw new Error('Offline');
    }),
  );

  await effector(effect, async (...args) => {
    actions.push(args);
  });
  expect(requests).toEqual([{ email: user.email }]);
  expect(actions).toEqual([
    ['users/ErrorReceiveAction', { errors: [effect.defaultError] }],
  ]);
});

test('unknown request failures are normalized for the error receiver', async () => {
  const actions: unknown[][] = [];
  const effector = createEffector(
    createSyntheticApi(() => {
      return Promise.reject(null);
    }),
  );

  await effector(
    {
      ...effect,
      onError: (errors) => {
        return {
          scope: 'users',
          type: 'ErrorReceiveAction',
          payload: { errors },
        };
      },
    },
    async (...args) => {
      actions.push(args);
    },
  );
  expect(actions).toEqual([
    ['users/ErrorReceiveAction', { errors: [effect.defaultError] }],
  ]);
});

test('success receiver exceptions reject without calling the error receiver', async () => {
  let errorCalls = 0;
  const failure = new Error('Broken receiver');

  await expect(
    createEffector(
      createSyntheticApi(async () => {
        return user;
      }),
    )(
      {
        ...effect,
        onSuccess: () => {
          throw failure;
        },
        onError: (errors) => {
          errorCalls += 1;

          return {
            scope: 'users',
            type: 'ErrorReceiveAction',
            payload: { errors },
          };
        },
      },
      async () => {},
    ),
  ).rejects.toBe(failure);
  expect(errorCalls).toBe(0);
});

test('dispatch failures reject without being reclassified as API failures', async () => {
  let errorCalls = 0;
  const failure = new Error('Broken reducer');

  await expect(
    createEffector(
      createSyntheticApi(async () => {
        return user;
      }),
    )(
      {
        ...effect,
        onError: (errors) => {
          errorCalls += 1;

          return {
            scope: 'users',
            type: 'ErrorReceiveAction',
            payload: { errors },
          };
        },
      },
      async () => {
        throw failure;
      },
    ),
  ).rejects.toBe(failure);
  expect(errorCalls).toBe(0);
});

test('error receiver exceptions propagate without retry', async () => {
  const failure = new Error('Broken error receiver');

  await expect(
    createEffector(
      createSyntheticApi(async () => {
        throw new Error('Offline');
      }),
    )(
      {
        ...effect,
        onError: () => {
          throw failure;
        },
      },
      async () => {},
    ),
  ).rejects.toBe(failure);
});

test('DispatchActionEffect waits for the forwarded action', async () => {
  const completion = Promise.withResolvers<void>();
  const actions: unknown[][] = [];
  let completed = false;
  const pending = createEffector(
    createSyntheticApi(async () => {
      return user;
    }),
  )(
    {
      type: 'DispatchActionEffect',
      action: { scope: 'users', type: 'LoadAction' },
    },
    async (...args) => {
      actions.push(args);
      await completion.promise;
    },
  ).then(() => {
    completed = true;
  });

  await Promise.resolve();
  expect(actions).toEqual([['users/LoadAction']]);
  expect(completed).toBe(false);
  completion.resolve();
  await pending;
});
