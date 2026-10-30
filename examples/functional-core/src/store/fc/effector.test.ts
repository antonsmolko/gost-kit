import { expect, test } from 'vitest';
import { createEffector } from './effector';
import type { ApiClient, ApiEffect } from '../types/effect';
import type { RootAction } from '../types/action';
import type { User } from '../../features/user/domain/entities/user';

const user: User = { id: '1', name: 'Ada', email: 'ada@example.test' };
const effect: ApiEffect = {
  type: 'ApiEffect', url: '/user', body: { email: user.email },
  defaultError: { code: 'USER_LOAD_FAILED', message: 'Could not load user', path: [] },
  receiverSuccess: (response) => ({ scope: 'users', type: 'SuccessReceiveAction', response }),
  receiverError: (errors) => ({ scope: 'users', type: 'ErrorReceiveAction', errors }),
};

test('request failure dispatches the configured default error', async () => {
  const actions: RootAction[] = [];
  const requests: Parameters<ApiClient>[0][] = [];
  const effector = createEffector(async (request) => {
    requests.push(request);
    throw new Error('Offline');
  });
  await effector(effect, async (action) => { actions.push(action); });
  expect(requests).toEqual([{ url: '/user', body: { email: user.email } }]);
  expect(actions).toEqual([{ scope: 'users', type: 'ErrorReceiveAction', errors: [effect.defaultError] }]);
});

test('unknown request failures are normalized for the error receiver', async () => {
  const actions: RootAction[] = [];
  const effector = createEffector(() => Promise.reject(null));
  await effector({
    ...effect,
    receiverError: (errors) => ({ scope: 'users', type: 'ErrorReceiveAction', errors }),
  }, async (action) => { actions.push(action); });
  expect(actions).toEqual([{
    scope: 'users', type: 'ErrorReceiveAction', errors: [effect.defaultError],
  }]);
});

test('success receiver exceptions reject without calling the error receiver', async () => {
  let errorCalls = 0;
  const failure = new Error('Broken receiver');
  await expect(createEffector(async () => user)({
    ...effect,
    receiverSuccess: () => { throw failure; },
    receiverError: () => { errorCalls += 1; return { scope: 'users', type: 'LoadAction' }; },
  }, async () => {})).rejects.toBe(failure);
  expect(errorCalls).toBe(0);
});

test('dispatch failures reject without being reclassified as API failures', async () => {
  let errorCalls = 0;
  const failure = new Error('Broken reducer');
  await expect(createEffector(async () => user)({
    ...effect,
    receiverError: () => { errorCalls += 1; return { scope: 'users', type: 'LoadAction' }; },
  }, async () => { throw failure; })).rejects.toBe(failure);
  expect(errorCalls).toBe(0);
});

test('error receiver exceptions propagate without retry', async () => {
  const failure = new Error('Broken error receiver');
  await expect(createEffector(async () => { throw new Error('Offline'); })({
    ...effect, receiverError: () => { throw failure; },
  }, async () => {})).rejects.toBe(failure);
});

test('DispatchActionEffect waits for the forwarded action', async () => {
  const completion = Promise.withResolvers<void>();
  const actions: RootAction[] = [];
  let completed = false;
  const pending = createEffector(async () => user)({
    type: 'DispatchActionEffect', action: { scope: 'users', type: 'LoadAction' },
  }, async (action) => { actions.push(action); await completion.promise; })
    .then(() => { completed = true; });
  await Promise.resolve();
  expect(actions).toEqual([{ scope: 'users', type: 'LoadAction' }]);
  expect(completed).toBe(false);
  completion.resolve();
  await pending;
});
