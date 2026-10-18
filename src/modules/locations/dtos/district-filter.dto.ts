import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class DistrictFilterDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  municipalityId!: number;

  @IsString()
  @IsOptional()
  filter!: string;
}
