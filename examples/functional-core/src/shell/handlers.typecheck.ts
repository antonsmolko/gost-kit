// Compile-only checks: this file is included by check, not imported by the app.
import { define } from './handlers.ts';
import type { ReducerHandlers, EffectorHandlers } from './handlers.ts';

type State = { email: string };
type Action = { type: 'SetEmailAction'; email: string } | { type: 'LoadAction' };
type Effect = { type: 'ApiEffect'; url: string };

const reducers = define.reducer<State, Action, Effect>({
  SetEmailAction: ({ state, action }) => {
    // @ts-expect-error SetEmailAction has no url field.
    void action.url;
    return { state: { ...state, email: action.email } };
  },
  LoadAction: ({ state, action }) => {
    // @ts-expect-error LoadAction has no email payload.
    void action.email;
    return { state };
  },
});

// @ts-expect-error Every declared action needs a handler in its definition table.
const missing: ReducerHandlers<State, Action, Effect> = { SetEmailAction: reducers.SetEmailAction };
void missing;

const effectors = define.effector<Action, Effect>({
  ApiEffect: async ({ effect, dispatch }) => {
    void effect.url;
    // @ts-expect-error ApiEffect has no email field.
    void effect.email;
    await dispatch({ type: 'SetEmailAction', email: 'ada@example.test' });
    // @ts-expect-error Dispatch validates the payload of the selected action.
    await dispatch({ type: 'SetEmailAction', url: '/user' });
  },
});

// @ts-expect-error Every declared effect needs a handler in its definition table.
const missingEffect: EffectorHandlers<Action, Effect> = {};
void missingEffect;
void effectors;
