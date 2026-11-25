import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { DATE_REGEX } from '../../common/date-time.util.js';
import { AvailabilityStatus } from '../entities/availability.entity.js';

export class QueryAvailabilitiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'availableDate must be in YYYY-MM-DD format' })
  availableDate?: string;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;
}
