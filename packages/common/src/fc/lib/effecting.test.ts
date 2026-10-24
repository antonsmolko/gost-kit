import { expect, expectTypeOf, test } from 'vitest';
import { define } from './define';
import { effecting } from './effecting';
import type { Effector } from '../types/effector';
import type { EffectorHandlers } from '../types/effector-handlers';

type Action = { type: 'SetAction'; count: number } | { type: 'IdleAction' };
type Effect = { type: 'RecordEffect'; value: number } | { type: 'OtherEffect' };

test('effecting composes effect tables and forwards dispatch and async completion', async () => {
  const completion = Promise.withResolvers<void>();
  const actions: Action[] = [];
  const first = define.effector<Action, Extract<Effect, { type: 'RecordEffect' }>>({
    RecordEffect: async ({ effect, dispatch }) => {
      await dispatch({ type: 'SetAction', count: effect.value });
      await completion.promise;
    },
  });
  const second = define.effector<Action, Extract<Effect, { type: 'OtherEffect' }>>({
    OtherEffect: async ({ dispatch }) => { await dispatch({ type: 'IdleAction' }); },
  });
  const effector: Effector<Action, Effect> = effecting(first, second);
  let completed = false;
  const dispatch = async (action: Action) => { actions.push(action); };
  const pending = effector({ type: 'RecordEffect', value: 7 }, dispatch)
    .then(() => { completed = true; });
  await Promise.resolve();
  expect(actions).toEqual([{ type: 'SetAction', count: 7 }]);
  expect(completed).toBe(false);
  completion.resolve();
  await pending;
  await effector({ type: 'OtherEffect' }, dispatch);
  expect(actions[1]).toEqual({ type: 'IdleAction' });
});

test('requires coverage of every declared effect', () => {
  const handlers = define.effector<Action, Extract<Effect, { type: 'OtherEffect' }>>({
    OtherEffect: async () => {},
  });
  // @ts-expect-error RecordEffect has no handler.
  const missing: Effector<Action, Effect> = effecting(handlers);
  // @ts-expect-error No handlers cover the declared effects.
  const empty: Effector<Action, Effect> = effecting();
  const optional: Partial<EffectorHandlers<Action, Effect>> = {};
  // @ts-expect-error Optional handlers cannot guarantee effect coverage.
  const uncertain: Effector<Action, Effect> = effecting(optional);
  const possiblyUndefined: { OtherEffect: typeof handlers.OtherEffect | undefined } = { OtherEffect: undefined };
  // @ts-expect-error A possibly undefined handler cannot guarantee effect coverage.
  const undefinedEffector: Effector<Action, Extract<Effect, { type: 'OtherEffect' }>> = effecting(possiblyUndefined);
  const chooseTable = (first: boolean) => first ? handlers : { RecordEffect: async () => {} };
  // @ts-expect-error Each alternative is missing one declared effect.
  const alternatives: Effector<Action, Effect> = effecting(chooseTable(true));
  const chooseTables = (first: boolean) => first
    ? [handlers, { RecordEffect: async () => {} }] as const
    : [handlers] as const;
  // @ts-expect-error One tuple alternative is missing RecordEffect.
  const alternativeTables: Effector<Action, Effect> = effecting(...chooseTables(true));
  // @ts-expect-error Explicit tuple types must not bypass coverage of each alternative.
  const explicitAlternatives = effecting<Action, Effect, ReturnType<typeof chooseTables>>(...chooseTables(true));
  const dynamic = [handlers];
  // @ts-expect-error A dynamic array cannot prove handler ownership or coverage.
  const dynamicEffector: Effector<Action, Effect> = effecting(...dynamic);
  // @ts-expect-error OtherEffect has two owners.
  const duplicate: Effector<Action, Extract<Effect, { type: 'OtherEffect' }>> = effecting(handlers, handlers);
  const noEffects: Effector<Action, never> = effecting();
  expectTypeOf(missing).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(empty).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(uncertain).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(undefinedEffector).toEqualTypeOf<Effector<Action, Extract<Effect, { type: 'OtherEffect' }>>>();
  expectTypeOf(alternatives).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(alternativeTables).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(explicitAlternatives).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(dynamicEffector).toEqualTypeOf<Effector<Action, Effect>>();
  expectTypeOf(duplicate).toEqualTypeOf<Effector<Action, Extract<Effect, { type: 'OtherEffect' }>>>();
  expectTypeOf(noEffects).toEqualTypeOf<Effector<Action, never>>();
});

test('retains inline effect inference across complete tables', async () => {
  const actions: Action[] = [];
  const effector: Effector<Action, Effect> = effecting(
    { RecordEffect: async ({ effect, dispatch }) => { await dispatch({ type: 'SetAction', count: effect.value }); } },
    { OtherEffect: async ({ dispatch }) => { await dispatch({ type: 'IdleAction' }); } },
  );
  await effector({ type: 'RecordEffect', value: 3 }, async (action) => { actions.push(action); });
  expect(actions).toEqual([{ type: 'SetAction', count: 3 }]);
});
