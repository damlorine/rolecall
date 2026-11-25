import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DATE_REGEX, TIME_REGEX } from '../../common/date-time.util.js';

export class CreateRehearsalDto {
  @IsInt()
  @Min(1)
  productionId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @Matches(DATE_REGEX, { message: 'rehearsalDate must be in YYYY-MM-DD format' })
  rehearsalDate: string;

  @Matches(TIME_REGEX, { message: 'startTime must be in HH:MM:SS format' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'endTime must be in HH:MM:SS format' })
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
