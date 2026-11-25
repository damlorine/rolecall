import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
