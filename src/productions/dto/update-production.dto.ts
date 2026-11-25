import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DATE_REGEX } from '../../common/date-time.util.js';

export class UpdateProductionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  venue?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  directorId?: number;
}
