import type { DisclosureState } from '../domain/fc/state';
import type { DisclosureView } from '../types/disclosure-view';

export const disclosurePresenter = ({
  state,
}: {
  state: DisclosureState;
}): DisclosureView => {
  return { isOpen: state.open, isHidden: !state.open };
};
