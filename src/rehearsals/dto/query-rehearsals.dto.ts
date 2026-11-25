import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { DATE_REGEX } from '../../common/date-time.util.js';

export class QueryRehearsalsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productionId?: number;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'rehearsalDate must be in YYYY-MM-DD format' })
  rehearsalDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
