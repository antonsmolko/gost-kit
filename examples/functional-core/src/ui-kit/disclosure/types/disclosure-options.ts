import type { OpenChangeHandler } from './open-change-handler';

export type DisclosureOptions =
  | {
      readonly open: boolean;
      readonly onOpenChange: OpenChangeHandler;
      readonly defaultOpen?: never;
    }
  | {
      readonly open?: undefined;
      readonly defaultOpen?: boolean;
      readonly onOpenChange?: OpenChangeHandler;
    };
