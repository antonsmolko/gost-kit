import { afterEach, expect, test, vi } from 'vitest';
import type { Dispatch, Effector } from '../../fc';
import { logEffector } from './log-effector';

type Action = { type: 'SavedAction' };
type Effect = { type: 'SaveEffect' };

afterEach(() => vi.restoreAllMocks());

test('logs before execution and still waits for the original effector', async () => {
  const events: string[] = [];
  const output = vi.spyOn(console, 'log').mockImplementation(() => { events.push('log'); });
  const completion = Promise.withResolvers<void>();
  const dispatch = vi.fn<Dispatch<Action>>(async () => {});
  const effector = vi.fn<Effector<Action, Effect>>(() => {
    events.push('effect');
    return completion.promise;
  });
  const effect: Effect = { type: 'SaveEffect' };
  let finished = false;
  const pending = logEffector(effector, { isEnabled: true })(effect, dispatch)
    .then(() => { finished = true; });

  expect(effector).toHaveBeenCalledExactlyOnceWith(effect, dispatch);
  expect(events).toEqual(['log', 'effect']);
  await Promise.resolve();
  expect(finished).toBe(false);
  expect(output).toHaveBeenCalledOnce();
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

test('logs the trigger even when the effector rejects and preserves its error', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = new Error('Effect failed');
  const effector: Effector<Action, Effect> = async () => { throw error; };
  await expect(logEffector(effector, { isEnabled: true })({ type: 'SaveEffect' }, async () => {}))
    .rejects.toBe(error);
  expect(output).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining('SaveEffect'), expect.any(String), { trigger: { type: 'SaveEffect' } },
  );
});

test('logs the effect before its nested dispatch', async () => {
  const events: string[] = [];
  vi.spyOn(console, 'log').mockImplementation(() => { events.push('effect log'); });
  const effector: Effector<Action, Effect> = async (_effect, dispatch) => {
    await dispatch({ type: 'SavedAction' });
  };
  await logEffector(effector, { isEnabled: true })({ type: 'SaveEffect' }, async (action) => {
    events.push(action.type);
  });
  expect(events).toEqual(['effect log', 'SavedAction']);
});
