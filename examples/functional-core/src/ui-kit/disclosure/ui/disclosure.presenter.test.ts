import { expect, test } from 'vitest';
import { disclosurePresenter } from './disclosure.presenter';

test.each([
  { open: false, view: { isOpen: false, isHidden: true } },
  { open: true, view: { isOpen: true, isHidden: false } },
])(
  'prepares both display flags for open=$open without changing input',
  ({ open, view }) => {
    const state = Object.freeze({ open });

    expect(disclosurePresenter({ state })).toEqual(view);
    expect(state).toEqual({ open });
  },
);
