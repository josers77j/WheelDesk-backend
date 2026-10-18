import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class MunicipalityFilterDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  departmentId!: number;

  @IsString()
  @IsOptional()
  filter!: string;
}
