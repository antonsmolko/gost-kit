import { expect, test } from 'vitest';
import { disclosureReducer } from './reducer';
import { disclosureState } from './state';

test.each([
  { from: false, to: true },
  { from: true, to: false },
])(
  'toggle $from → $to returns a new state and one value-bearing effect',
  ({ from, to }) => {
    const state = Object.freeze(disclosureState({ open: from }));
    const commit = disclosureReducer(state, { type: 'ToggleAction' });

    expect(commit).toEqual({
      state: { open: to },
      effects: [{ type: 'OpenChangeEffect', open: to }],
    });
    expect(commit.state).not.toBe(state);
    expect(state).toEqual({ open: from });
  },
);

test.each([
  { from: false, to: true },
  { from: true, to: false },
])(
  'SetOpen $from → $to returns the requested value and effect',
  ({ from, to }) => {
    const state = Object.freeze(disclosureState({ open: from }));
    const action = Object.freeze({ type: 'SetOpenAction' as const, open: to });
    const commit = disclosureReducer(state, action);

    expect(commit).toEqual({
      state: { open: to },
      effects: [{ type: 'OpenChangeEffect', open: to }],
    });
    expect(state).toEqual({ open: from });
    expect(action).toEqual({ type: 'SetOpenAction', open: to });
  },
);

test.each([false, true])(
  'SetOpen(%s) no-op preserves identity without effects',
  (open) => {
    const state = Object.freeze(disclosureState({ open }));
    const commit = disclosureReducer(state, { type: 'SetOpenAction', open });

    expect(commit.state).toBe(state);
    expect(commit.effects).toEqual([]);
  },
);
