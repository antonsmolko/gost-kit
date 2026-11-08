import { expect, test } from 'vitest';
import { globalAlertPresenter } from './global-alert.presenter';

test('null alert has no visible block and empty text', () => {
  expect(globalAlertPresenter({ alert: null })).toEqual({
    isVisible: false,
    message: '',
  });
});

test.each(['Could not load user', ''])(
  'an alert renders its exact text: %j',
  (message) => {
    const alert = Object.freeze({ status: 'error' as const, message });

    expect(globalAlertPresenter({ alert })).toEqual({
      isVisible: true,
      message,
    });
    expect(globalAlertPresenter({ alert })).toEqual({
      isVisible: true,
      message,
    });
    expect(alert).toEqual({ status: 'error', message });
  },
);
