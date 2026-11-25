import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCastAssignmentDto {
  @IsInt()
  @Min(1)
  rehearsalId: number;

  @IsInt()
  @Min(1)
  actorId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  roleName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
