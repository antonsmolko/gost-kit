import type { ApiResponse } from '@gost-kit/common';
import type { Paths } from '../../../../api/paths';

export type UserDto = ApiResponse<Paths, { method: 'post'; url: '/user' }>;
