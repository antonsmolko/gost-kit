import { expect, test } from 'vitest';
import { createApiClient } from '@gost-kit/common';
import type { Paths } from '../api/paths';
import type { UserDto } from '../features/user/data/dto/user-dto';
import { createRootStore } from './root';
import { createSyntheticApi } from '../api/create-synthetic-api';
import type { User } from '../features/user/domain/entities/user';

const userDto: UserDto = {
  user_id: 1,
  full_name: 'Ada',
  email: 'ada@example.test',
};
const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };

test('dispatch applies an input action synchronously and returns a promise', async () => {
  const root = createRootStore(
    createSyntheticApi(async () => {
      return userDto;
    }),
  );
  const completed = root.dispatch({
    scope: 'users',
    type: 'SetEmailAction',
    email: user.email,
  });

  expect(root.state.user.email).toBe(user.email);
  await completed;
});

test('await dispatch waits for API and the success receiver action', async () => {
  const request = Promise.withResolvers<UserDto>();
  const root = createRootStore(
    createSyntheticApi(() => {
      return request.promise;
    }),
  );
  let completed = false;
  const pending = root
    .dispatch({ scope: 'users', type: 'LoadAction' })
    .then(() => {
      completed = true;
    });

  expect(root.state.user.status).toBe('loading');
  await Promise.resolve();
  expect(completed).toBe(false);
  request.resolve(userDto);
  await pending;
  expect(root.state.user.data).toEqual(user);
  expect(root.state.user.status).toBe('ready');
});

test('request rejection reaches a global alert through nested dispatch', async () => {
  const root = createRootStore(
    createSyntheticApi(() => {
      return Promise.reject(new Error('Offline'));
    }),
  );

  await root.dispatch({ scope: 'users', type: 'LoadAction' });
  expect(root.state.user.status).toBe('error');
  expect(root.state.alert).toEqual({
    status: 'error',
    message: 'Could not load user',
  });
  expect(root.state.user.errors).toEqual([
    { code: 'USER_LOAD_FAILED', message: 'Could not load user', path: [] },
  ]);
});

test('retry clears the feature error and can succeed', async () => {
  let failed = true;
  const root = createRootStore(
    createSyntheticApi(async () => {
      if (failed) {
        throw new Error('Offline');
      }

      return userDto;
    }),
  );

  await root.dispatch({ scope: 'users', type: 'LoadAction' });
  failed = false;
  await root.dispatch({ scope: 'users', type: 'LoadAction' });
  expect(root.state.user.errors).toEqual([]);
  expect(root.state.user.data).toEqual(user);
});

test('root instances do not share state', async () => {
  const first = createRootStore(
    createSyntheticApi(async () => {
      return userDto;
    }),
  );
  const second = createRootStore(
    createSyntheticApi(async () => {
      return userDto;
    }),
  );

  await first.dispatch({
    scope: 'users',
    type: 'SetEmailAction',
    email: user.email,
  });
  expect(second.state.user.email).toBe('');
});

test('mapper failure exits loading and reaches the global UI alert', async () => {
  const api = createApiClient<Paths>({
    baseUrl: 'https://example.test',
    fetch: async () => {
      return Response.json(null);
    },
  });
  const root = createRootStore(api);

  await root.dispatch({ scope: 'users', type: 'LoadAction' });
  expect(root.state.user.status).toBe('error');
  expect(root.state.alert).toEqual({
    status: 'error',
    message: 'Could not load user',
  });
  expect(root.state.user.errors).toEqual([
    { code: 'USER_LOAD_FAILED', message: 'Could not load user', path: [] },
  ]);
});
