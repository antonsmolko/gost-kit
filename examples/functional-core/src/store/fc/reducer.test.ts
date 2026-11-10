import { expect, test } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './state';

test('global alert actions update application state outside user state', () => {
  const state = initialState();
  const shown = reducer(state, {
    type: 'ShowAlertAction',
    status: 'error',
    message: 'Offline',
  });

  expect(shown.state.user).toBe(state.user);
  expect(shown.state.alert?.message).toBe('Offline');
});

test('details intent changes only app-owned disclosure value', () => {
  const state = Object.freeze(
    initialState({
      alert: { status: 'error', message: 'Keep this alert' },
    }),
  );
  const commit = reducer(state, { type: 'SetDetailsOpenAction', open: true });

  expect(state.detailsOpen).toBe(false);
  expect(commit.state.detailsOpen).toBe(true);
  expect(commit.state.user).toBe(state.user);
  expect(commit.state.alert).toBe(state.alert);
  expect(commit.effects).toEqual([]);
});
