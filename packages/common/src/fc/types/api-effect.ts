import type {
  ApiOperation,
  ApiOperationData,
  ApiOperationOptions,
} from '../../api';
import type { ApiEffectFields } from './api-effect-fields';
import type { Trigger } from './trigger';

/** An API effect always references its schema-typed operation. */
export type ApiEffect<
  TOperation extends ApiOperation,
  TSuccessAction extends Trigger,
  TErrorAction extends Trigger,
> = TOperation extends ApiOperation
  ? ApiOperationOptions<TOperation> &
      ApiEffectFields<
        TOperation,
        ApiOperationData<TOperation>,
        TSuccessAction,
        TErrorAction
      >
  : never;
