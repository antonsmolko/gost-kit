import { afterEach, expect, test, vi } from 'vitest';
import type { Commit, Reducer } from '../../fc';
import { logReducer } from './log-reducer';

type State = { count: number };
type Action = { type: 'IncrementAction' };
type Effect = { type: 'SaveEffect' };

afterEach(() => vi.restoreAllMocks());

test('returns the original commit and logs the action, previous state, next state and effects', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const state = { count: 0 };
  const action: Action = { type: 'IncrementAction' };
  const commit: Commit<State, Effect> = { state: { count: 1 }, effects: [{ type: 'SaveEffect' }] };
  const reducer = vi.fn<Reducer<State, Action, Effect>>(() => commit);

  expect(logReducer(reducer, { isEnabled: true })(state, action)).toBe(commit);
  expect(reducer).toHaveBeenCalledExactlyOnceWith(state, action);
  expect(output).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining(action.type), expect.any(String),
    { trigger: action, prev: state, next: commit.state, effects: commit.effects },
  );
});

test.each([undefined, { isEnabled: false }])('runs the reducer without logging when disabled: %s', (config) => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const commit: Commit<State, Effect> = { state: { count: 1 }, effects: [] };
  const reducer = vi.fn<Reducer<State, Action, Effect>>(() => commit);
  expect(logReducer(reducer, config)({ count: 0 }, { type: 'IncrementAction' })).toBe(commit);
  expect(reducer).toHaveBeenCalledOnce();
  expect(output).not.toHaveBeenCalled();
});

test('preserves a reducer exception and does not log a commit', () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = new Error('Reducer failed');
  const reducer: Reducer<State, Action, Effect> = () => { throw error; };
  expect(() => logReducer(reducer, { isEnabled: true })({ count: 0 }, { type: 'IncrementAction' })).toThrow(error);
  expect(output).not.toHaveBeenCalled();
});
