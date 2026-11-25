import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DATE_REGEX, TIME_REGEX } from '../../common/date-time.util.js';

export class UpdateRehearsalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  productionId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'rehearsalDate must be in YYYY-MM-DD format' })
  rehearsalDate?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:MM:SS format' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'endTime must be in HH:MM:SS format' })
  endTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
