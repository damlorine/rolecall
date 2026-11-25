import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_REGEX, TIME_REGEX } from '../../common/date-time.util.js';
import { AvailabilityStatus } from '../entities/availability.entity.js';

export class UpdateAvailabilityDto {
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'availableDate must be in YYYY-MM-DD format' })
  availableDate?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:MM:SS format' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'endTime must be in HH:MM:SS format' })
  endTime?: string;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
