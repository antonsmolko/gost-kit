import { afterEach, expect, test, vi } from 'vitest';
import type { Dispatch, Effector } from '../../fc';
import { logEffector } from './log-effector';

type Action = { type: 'SavedAction' };
type Effect = { type: 'SaveEffect' };

afterEach(() => vi.restoreAllMocks());

test('passes the effect and dispatch through, waits for execution, then logs once', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const completion = Promise.withResolvers<void>();
  const dispatch = vi.fn<Dispatch<Action>>(async () => {});
  const effector = vi.fn<Effector<Action, Effect>>(() => completion.promise);
  const effect: Effect = { type: 'SaveEffect' };
  let finished = false;
  const pending = logEffector(effector, { isEnabled: true })(effect, dispatch)
    .then(() => { finished = true; });

  expect(effector).toHaveBeenCalledExactlyOnceWith(effect, dispatch);
  await Promise.resolve();
  expect(finished).toBe(false);
  expect(output).not.toHaveBeenCalled();
  completion.resolve();
  await pending;
  expect(finished).toBe(true);
  expect(output).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining(effect.type), expect.any(String), { trigger: effect },
  );
});

test.each([undefined, { isEnabled: false }])('executes effects without logging when disabled: %s', async (config) => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const effector = vi.fn<Effector<Action, Effect>>(async () => {});
  await logEffector(effector, config)({ type: 'SaveEffect' }, async () => {});
  expect(effector).toHaveBeenCalledOnce();
  expect(output).not.toHaveBeenCalled();
});

test('preserves an effector rejection without logging success', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = new Error('Effect failed');
  const effector: Effector<Action, Effect> = async () => { throw error; };
  await expect(logEffector(effector, { isEnabled: true })({ type: 'SaveEffect' }, async () => {}))
    .rejects.toBe(error);
  expect(output).not.toHaveBeenCalled();
});
