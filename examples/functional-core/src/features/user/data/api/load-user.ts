import { defineApiOperation } from '@gost-kit/common';
import type { Paths } from '../../../../api/paths';
import { mapUser } from '../mappers/map-user';

export const loadUser = defineApiOperation<Paths>()({
  method: 'post',
  url: '/user',
  mapResponse: mapUser,
});
