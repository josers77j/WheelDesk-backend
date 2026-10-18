import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { TransferDetailDto } from './create-transfer.dto';

export class UpdateTransferDto {
  @IsArray({ message: 'El campo «Detalle» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Detalle» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message: 'El campo «Detalle» debe contener datos válidos.',
  })
  @Type(() => TransferDetailDto)
  details!: TransferDetailDto[];
}
