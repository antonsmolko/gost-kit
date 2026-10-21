// Compile-only checks: this file is included by check, not imported by the app.
import { define, reducing, effecting } from './handlers.ts';
import type { ReducerHandlers, EffectorHandlers } from './handlers.ts';
import type { Reducer, Effector } from './types.ts';

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

// @ts-expect-error A reducer action has one owner across the composed tables.
const duplicateReducer: Reducer<State, Action, Effect> = reducing(reducers, reducers);
// @ts-expect-error An effect has one owner across the composed tables.
const duplicateEffector: Effector<Action, Effect> = effecting(effectors, effectors);
void duplicateReducer;
void duplicateEffector;

const inlineReducer: Reducer<State, Action, Effect> = reducing({
  SetEmailAction: ({ state, action }) => {
    // @ts-expect-error Inline handlers retain the narrowed action payload.
    void action.url;
    return { state: { ...state, email: action.email } };
  },
});
const inlineEffector: Effector<Action, Effect> = effecting({
  ApiEffect: async ({ effect, dispatch }) => {
    void effect.url;
    // @ts-expect-error Inline handlers retain dispatch payload checks.
    await dispatch({ type: 'SetEmailAction', url: '/user' });
  },
});
void inlineReducer;
void inlineEffector;

const dynamicReducers: Partial<ReducerHandlers<State, Action, Effect>>[] = [reducers, reducers];
// @ts-expect-error A widened array cannot prove unique ownership; use static tables/tuples.
const dynamicReducer: Reducer<State, Action, Effect> = reducing(...dynamicReducers);
const dynamicEffectors: Partial<EffectorHandlers<Action, Effect>>[] = [effectors, effectors];
// @ts-expect-error A widened array cannot prove unique effect ownership.
const dynamicEffector: Effector<Action, Effect> = effecting(...dynamicEffectors);
void dynamicReducer;
void dynamicEffector;

const variadicReducers: [Partial<ReducerHandlers<State, Action, Effect>>, ...Partial<ReducerHandlers<State, Action, Effect>>[]] = [reducers, reducers];
// @ts-expect-error A variadic tuple cannot prove uniqueness of its unknown-length tail.
const variadicReducer: Reducer<State, Action, Effect> = reducing(...variadicReducers);
const variadicEffectors: [Partial<EffectorHandlers<Action, Effect>>, ...Partial<EffectorHandlers<Action, Effect>>[]] = [effectors, effectors];
// @ts-expect-error Variadic effect tuples also have an unchecked dynamic tail.
const variadicEffector: Effector<Action, Effect> = effecting(...variadicEffectors);
void variadicReducer;
void variadicEffector;

const multiInline: Reducer<State, Action, Effect> = reducing(
  { SetEmailAction: ({ state, action }) => ({ state: { ...state, email: action.email } }) },
  { LoadAction: ({ state, action }) => {
    // @ts-expect-error Second inline table must retain its own narrowed payload.
    void action.email;
    return { state };
  } },
);
void multiInline;

const multiInlineEffects: Effector<Action, Effect | { type: 'StoreEffect'; value: number }> = effecting(
  { ApiEffect: async ({ effect, dispatch }) => {
    await dispatch({ type: 'SetEmailAction', email: effect.url });
  } },
  { StoreEffect: async ({ effect, dispatch }) => {
    void effect.value;
    // @ts-expect-error Second inline effect retains its own narrowed payload.
    void effect.url;
    // @ts-expect-error Second inline effect retains dispatch payload typing.
    await dispatch({ type: 'SetEmailAction', url: '/user' });
  } },
);
void multiInlineEffects;
