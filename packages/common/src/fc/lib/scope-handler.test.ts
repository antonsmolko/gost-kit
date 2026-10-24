import { expect, test } from 'vitest';
import { scopeHandler } from './scope-handler';

type RootState = { user: { name: string }; auth: { name: string } };
type Action = { type: 'LoadAction'; name: string };
type Effect = { type: 'ReportEffect'; name: string };

const action: Action = { type: 'LoadAction', name: 'Ada' };

test('updates only the selected feature without mutating the original state', () => {
  const state: RootState = { user: { name: '' }, auth: { name: 'Grace' } };
  Object.freeze(state.user);
  Object.freeze(state);
  const nextUser = { name: 'Ada' };
  const handler = scopeHandler<RootState, 'user', Action, Effect>('user', () => ({ state: nextUser }));

  const draft = handler({ state, action }, state);

  expect(draft?.state).toEqual({ user: nextUser, auth: state.auth });
  expect(draft?.state).not.toBe(state);
  expect(draft?.state?.user).toBe(nextUser);
  expect(draft?.state?.auth).toBe(state.auth);
  expect(state.user.name).toBe('');
});

test('passes feature state, action and the supplied current root state to the handler', () => {
  const state: RootState = { user: { name: '' }, auth: { name: 'Grace' } };
  const currentRoot: RootState = { ...state, auth: { name: 'Ada' } };
  const handler = scopeHandler<RootState, 'user', Action, Effect>('user', (params, rootState) => {
    expect(params.state).toBe(state.user);
    expect(params.action).toBe(action);
    expect(rootState).toBe(currentRoot);
    return { state: { name: `${params.action.name} / ${rootState.auth.name}` } };
  });

  expect(handler({ state, action }, currentRoot)?.state?.user.name).toBe('Ada / Ada');
});

test('omits the root update when the feature reference is unchanged, preserving effects', () => {
  const state: RootState = { user: { name: 'Ada' }, auth: { name: 'Grace' } };
  const effect: Effect = { type: 'ReportEffect', name: 'Ada' };
  const handler = scopeHandler<RootState, 'user', Action, Effect>('user', ({ state }) => ({ state, effects: effect }));

  const draft = handler({ state, action }, state);

  expect(draft?.state).toBeUndefined();
  expect(draft?.effects).toBe(effect);
});

test('preserves an effects-only result and forwards its array without normalization', () => {
  const state: RootState = { user: { name: 'Ada' }, auth: { name: 'Grace' } };
  const effects: Effect[] = [{ type: 'ReportEffect', name: 'Ada' }];
  const handler = scopeHandler<RootState, 'user', Action, Effect>('user', () => ({ effects }));

  const draft = handler({ state, action }, state);

  expect(draft?.state).toBeUndefined();
  expect(draft?.effects).toBe(effects);
});

test.each([undefined, {}])('supports an empty handler result: %j', (result) => {
  const state: RootState = { user: { name: '' }, auth: { name: '' } };
  const handler = scopeHandler<RootState, 'user', Action, Effect>('user', () => result);

  const draft = handler({ state, action }, state);

  expect(draft?.state).toBeUndefined();
  expect(draft?.effects).toBeUndefined();
});

test.each([0, false, null])('accepts an explicit falsy feature state: %j', (nextState) => {
  type ValueState = { value: number | boolean | null; other: { name: string } };
  const state: ValueState = { value: 1, other: { name: 'Ada' } };
  const handler = scopeHandler<ValueState, 'value', Action, never>('value', () => ({ state: nextState }));

  const draft = handler({ state, action }, state);

  expect(draft?.state?.value).toBe(nextState);
  expect(draft?.state?.other).toBe(state.other);
  expect(state.value).toBe(1);
});
