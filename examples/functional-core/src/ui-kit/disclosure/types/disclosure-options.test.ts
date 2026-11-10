import { expectTypeOf, test } from 'vitest';
import type { DisclosureOptions } from './disclosure-options';
import type { OpenChangeHandler } from './open-change-handler';

test('ownership types require controlled callback and reject simultaneous defaults', () => {
  expectTypeOf<{
    open: boolean;
    onOpenChange: OpenChangeHandler;
  }>().toExtend<DisclosureOptions>();
  expectTypeOf<{ defaultOpen: boolean }>().toExtend<DisclosureOptions>();
  expectTypeOf<{ open: boolean }>().not.toExtend<DisclosureOptions>();
  expectTypeOf<{
    open: boolean;
    defaultOpen: boolean;
    onOpenChange: OpenChangeHandler;
  }>().not.toExtend<DisclosureOptions>();
});
