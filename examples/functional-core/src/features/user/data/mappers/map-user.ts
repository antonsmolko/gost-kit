import type { User } from '../../domain/entities/user';
import type { UserDto } from '../dto/user-dto';

export const mapUser = (dto: UserDto): User => {
  return { id: String(dto.user_id), name: dto.full_name, email: dto.email };
};
