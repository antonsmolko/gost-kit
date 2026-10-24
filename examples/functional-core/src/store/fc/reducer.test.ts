import { expect, test } from 'vitest';
import { reducer } from './reducer.ts';
import { initialState } from './state.ts';

test('global alert actions update application state outside user state', () => {
  const state = initialState();
  const shown = reducer(state, { type: 'ShowAlertAction', status: 'error', message: 'Offline' });
  expect(shown.state.user).toBe(state.user);
  expect(shown.state.alert?.message).toBe('Offline');
});
