// Compile-only checks for required API failure handling.
import type { ApiEffect } from './types.ts';

declare const effect: ApiEffect;
const { receiverError: omittedReceiver, ...withoutReceiver } = effect;
const { defaultError: omittedError, ...withoutDefaultError } = effect;
// @ts-expect-error API effects require an error receiver.
const missingReceiver: ApiEffect = withoutReceiver;
// @ts-expect-error API effects require a default AppError.
const missingDefaultError: ApiEffect = withoutDefaultError;
void omittedReceiver;
void omittedError;
void missingReceiver;
void missingDefaultError;
