import { expect, test } from 'vitest';
import { define } from './define';
import { reducing } from './reducing';
import { scope } from './scope';
import type { Reducer } from '../types/reducer';

type UserState = { name: string };
type RootState = { user: UserState; auth: { user: { name: string } }; config: { enabled: boolean } };
type Action = { type: 'LoadAction' } | { type: 'IdleAction' } | { type: 'ReportAction' };
type Effect = { type: 'ReportEffect'; name: string };

test('scope updates only feature state and supplies the complete current root state', () => {
  const handlers = define.reducer<UserState, Action, Effect, RootState>()({
    LoadAction: ({ state }, rootState) => ({
      state: { ...state, name: rootState.auth.user.name },
      effects: { type: 'ReportEffect', name: rootState.auth.user.name },
    }),
    IdleAction: () => {},
    ReportAction: ({ state }) => ({ effects: { type: 'ReportEffect', name: state.name } }),
  });
  const reducer: Reducer<RootState, Action, Effect> = reducing(scope('user', handlers));
  const state: RootState = { user: { name: '' }, auth: { user: { name: 'Ada' } }, config: { enabled: true } };

  const commit = reducer(state, { type: 'LoadAction' });

  expect(commit.state.user).toEqual({ name: 'Ada' });
  expect(commit.state.auth).toBe(state.auth);
  expect(commit.state.config).toBe(state.config);
  expect(state.user.name).toBe('');
  expect(commit.effects).toEqual([{ type: 'ReportEffect', name: 'Ada' }]);
  expect(reducer(state, { type: 'IdleAction' })).toEqual({ state, effects: [] });
  expect(reducer(state, { type: 'IdleAction' }).state).toBe(state);
  const report = reducer(state, { type: 'ReportAction' });
  expect(report.state).toBe(state);
  expect(report.effects).toEqual([{ type: 'ReportEffect', name: '' }]);
  expect(reducer({ ...state, auth: { user: { name: 'Grace' } } }, { type: 'LoadAction' }).state.user.name).toBe('Grace');

  // @ts-expect-error The feature must target an existing root property.
  scope('missing', handlers);
  // @ts-expect-error Auth state does not match the feature state shape.
  scope('auth', handlers);
  // @ts-expect-error Scoped handlers still have exactly one owner per action.
  const duplicate: Reducer<RootState, Action, Effect> = reducing(scope('user', handlers), scope('user', handlers));
  void duplicate;
});
