import { expect, test, vi } from 'vitest';
import { forwardAction } from './forward-action';

test('forwards callback actions as the correlated path and payload', async () => {
  const dispatch = vi.fn(async () => {});
  const payload = ['a', 'b'];

  await forwardAction(dispatch, {
    scope: 'users',
    type: 'SelectAction',
    payload,
  });

  expect(dispatch).toHaveBeenCalledExactlyOnceWith(
    'users/SelectAction',
    payload,
  );
});

test('forwards a root action without adding a payload argument', async () => {
  const dispatch = vi.fn(async () => {});

  await forwardAction(dispatch, { type: 'LoadAction' });

  expect(dispatch).toHaveBeenCalledExactlyOnceWith('root/LoadAction');
});

test('waits for the forwarded dispatch', async () => {
  const pending = Promise.withResolvers<void>();
  let completed = false;
  const result = forwardAction(
    async () => {
      return pending.promise;
    },
    {
      type: 'LoadAction',
    },
  ).then(() => {
    completed = true;
  });

  await Promise.resolve();
  expect(completed).toBe(false);
  pending.resolve();
  await result;
  expect(completed).toBe(true);
});
