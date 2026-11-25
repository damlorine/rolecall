import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCastAssignmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
