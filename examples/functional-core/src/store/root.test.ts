import { expect, test } from 'vitest';
import { createRootStore } from './root.ts';
import type { User } from '../features/user/domain/entities/user.ts';

const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };

test('dispatch applies an input action synchronously and returns a promise', async () => {
  const root = createRootStore(async () => user);
  const completed = root.dispatch({ type: 'UserSetEmailAction', email: user.email });
  expect(root.state.user.email).toBe(user.email);
  await completed;
});

test('await dispatch waits for API and the success receiver action', async () => {
  const request = Promise.withResolvers<User>();
  const root = createRootStore(() => request.promise);
  let completed = false;
  const pending = root.dispatch({ type: 'UserLoadAction' }).then(() => { completed = true; });
  expect(root.state.user.status).toBe('loading');
  await Promise.resolve();
  expect(completed).toBe(false);
  request.resolve(user);
  await pending;
  expect(root.state.user.data).toEqual(user);
  expect(root.state.user.status).toBe('ready');
});

test('request rejection reaches a global alert through nested dispatch', async () => {
  const root = createRootStore(() => Promise.reject(new Error('Offline')));
  await root.dispatch({ type: 'UserLoadAction' });
  expect(root.state.user.status).toBe('error');
  expect(root.state.alert).toEqual({ status: 'error', message: 'Could not load user' });
  expect(root.state.user.errors).toEqual([{ code: 'USER_LOAD_FAILED', message: 'Could not load user', path: [] }]);
});

test('retry clears the feature error and can succeed', async () => {
  let failed = true;
  const root = createRootStore(async () => {
    if (failed) throw new Error('Offline');
    return user;
  });
  await root.dispatch({ type: 'UserLoadAction' });
  failed = false;
  await root.dispatch({ type: 'UserLoadAction' });
  expect(root.state.user.errors).toEqual([]);
  expect(root.state.user.data).toEqual(user);
});

test('root instances do not share state', async () => {
  const first = createRootStore(async () => user);
  const second = createRootStore(async () => user);
  await first.dispatch({ type: 'UserSetEmailAction', email: user.email });
  expect(second.state.user.email).toBe('');
});
