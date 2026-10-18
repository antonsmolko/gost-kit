import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoadAction, createUserStore } from './user-store.ts';
import type { State, User } from './user-store.ts';

type UserStore = ReturnType<typeof createUserStore>;
const user: User = { id: '1', name: 'Ada' };

const waitForStatus = (store: UserStore, status: State['status']) => {
  const done = Promise.withResolvers<void>();
  const subscription = store.subscribe(({ context }) => {
    if (context.status === status) done.resolve();
  });
  if (store.getSnapshot().context.status === status) done.resolve();
  return done.promise.finally(() => subscription.unsubscribe());
};

test('action describes loading without running a request or mutating state', () => {
  let calls = 0;
  const loadUser = async () => { calls += 1; return user; };
  const state: State = Object.freeze({ status: 'idle', user: null, error: null });
  const result = createLoadAction(loadUser)(state);
  assert.equal(result.state.status, 'loading');
  assert.equal(result.effect.run, loadUser);
  assert.equal(state.status, 'idle');
  assert.equal(calls, 0);
  assert.deepEqual(result.effect.onSuccess(user), { type: 'loaded', user });
  assert.deepEqual(result.effect.onFailure({ message: 'Offline' }), {
    type: 'failed', error: { message: 'Offline' },
  });
});

test('pure store transition schedules an effect without executing or committing it', () => {
  let calls = 0;
  const store = createUserStore(async () => { calls += 1; return user; });
  const before = store.getSnapshot();
  const [next, effects] = store.transition(before, { type: 'load' });
  assert.equal(next.context.status, 'loading');
  assert.equal(effects.length, 1);
  assert.equal(calls, 0);
  assert.equal(before.context.status, 'idle');
  assert.equal(store.getSnapshot(), before);
});

test('request completion sends loaded back to the store', { timeout: 1000 }, async () => {
  const request = Promise.withResolvers<User>();
  const store = createUserStore(() => request.promise);
  const finished = waitForStatus(store, 'ready');
  store.trigger.load();
  assert.deepEqual(store.getSnapshot().context, { status: 'loading', user: null, error: null });
  request.resolve(user);
  await finished;
  assert.deepEqual(store.getSnapshot().context, { status: 'ready', user, error: null });
});

test('request rejection sends failed back to the store', { timeout: 1000 }, async () => {
  const request = Promise.withResolvers<User>();
  const store = createUserStore(() => request.promise);
  const finished = waitForStatus(store, 'error');
  store.trigger.load();
  request.reject(new Error('Service unavailable'));
  await finished;
  assert.deepEqual(store.getSnapshot().context, {
    status: 'error', user: null, error: 'Service unavailable',
  });
});

test('synchronous request failure is handled', { timeout: 1000 }, async () => {
  const store = createUserStore(() => { throw new Error('Cannot start request'); });
  const finished = waitForStatus(store, 'error');
  store.trigger.load();
  await finished;
  assert.equal(store.getSnapshot().context.error, 'Cannot start request');
});

test('non-Error rejection has a fallback message', { timeout: 1000 }, async () => {
  const store = createUserStore(() => Promise.reject(null));
  const finished = waitForStatus(store, 'error');
  store.trigger.load();
  await finished;
  assert.equal(store.getSnapshot().context.error, 'Request failed');
});

test('retry clears an earlier error and succeeds', { timeout: 1000 }, async () => {
  let request = Promise.withResolvers<User>();
  const store = createUserStore(() => request.promise);
  const failed = waitForStatus(store, 'error');
  store.trigger.load();
  request.reject(new Error('Try again'));
  await failed;
  request = Promise.withResolvers<User>();
  const ready = waitForStatus(store, 'ready');
  store.trigger.load();
  assert.equal(store.getSnapshot().context.status, 'loading');
  assert.equal(store.getSnapshot().context.error, null);
  request.resolve(user);
  await ready;
  assert.deepEqual(store.getSnapshot().context, { status: 'ready', user, error: null });
});
