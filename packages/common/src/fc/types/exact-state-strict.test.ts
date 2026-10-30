import { expectTypeOf, test } from 'vitest';
import type { DeepReadonly } from '../../types';
import type { ExactState } from './exact-state';
import type { ExactStateStrict } from './exact-state-strict';

test('the simple version permits mixed extra fields while the strict version rejects them', () => {
  type State = { items: { id: string }[] };
  type Candidate = { items: ({ id: string } | { id: string; extra: boolean })[] };

  expectTypeOf<Candidate>().toExtend<ExactState<State, Candidate>>();
  expectTypeOf<ExactStateStrict<State, Candidate>>().toEqualTypeOf<never>();
});

test('strict checking rejects undefined extra fields and deeper mixed variants', () => {
  type State = { items: { id: string }[] };
  type UndefinedExtra = { items: ({ id: string } | { id: string; extra: undefined })[] };
  type NestedState = { items: { value: { id: string } }[] };
  type NestedExtra = { items: ({ value: { id: string } } | { value: { id: string; extra: boolean } })[] };

  expectTypeOf<ExactStateStrict<State, UndefinedExtra>>().toEqualTypeOf<never>();
  expectTypeOf<ExactStateStrict<NestedState, NestedExtra>>().toEqualTypeOf<never>();
});

test('strict checking preserves declared nullable unions and checks variant-specific keys', () => {
  type Item = { kind: 'user'; id: string } | { kind: 'error'; message: string };
  type State = { items: (Item | null)[] };
  type Extra = { items: (Item | { kind: 'user'; id: string; message: string } | null)[] };

  expectTypeOf<ExactStateStrict<State, State>>().toEqualTypeOf<State>();
  expectTypeOf<ExactStateStrict<State, Extra>>().toEqualTypeOf<never>();
});

test('strict checking supports recursive states without skipping extra keys in new branches', () => {
  type Tree = { id: string; children: Tree[] };
  type NarrowTree = { id: 'a'; children: NarrowTree[] };
  type ExtraTree = { id: string; children: (Tree | (Tree & { extra: boolean }))[] };

  expectTypeOf<ExactStateStrict<DeepReadonly<Tree>, DeepReadonly<Tree>>>().toEqualTypeOf<DeepReadonly<Tree>>();
  expectTypeOf<ExactStateStrict<DeepReadonly<Tree>, NarrowTree>>().toEqualTypeOf<NarrowTree>();
  expectTypeOf<ExactStateStrict<DeepReadonly<Tree>, ExtraTree>>().toEqualTypeOf<never>();
});

test('both versions reject missing required fields and incorrect value types', () => {
  type State = { items: { id: string }[] };
  type Missing = { items: {}[] };
  type Incorrect = { items: { id: number }[] };

  expectTypeOf<Missing>().not.toExtend<ExactState<State, Missing>>();
  expectTypeOf<Incorrect>().not.toExtend<ExactState<State, Incorrect>>();
  expectTypeOf<ExactStateStrict<State, Missing>>().toEqualTypeOf<never>();
  expectTypeOf<ExactStateStrict<State, Incorrect>>().toEqualTypeOf<never>();
});
