import { guard } from '@gost-kit/common';
import type { RootState } from './store/types/state';

type AlertViewState = { isVisible: boolean; message: string };

export const globalAlertPresenter = ({
  alert,
}: {
  alert: RootState['alert'];
}): AlertViewState => {
  return { isVisible: !guard.nlx(alert), message: alert?.message ?? '' };
};
