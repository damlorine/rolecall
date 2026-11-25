import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryCastAssignmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rehearsalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actorId?: number;
}
