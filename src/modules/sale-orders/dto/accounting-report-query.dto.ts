import { IsDateString, Matches } from 'class-validator';

export class AccountingReportQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Seleccione la fecha inicial en formato YYYY-MM-DD.',
  })
  @IsDateString(
    { strict: true },
    { message: 'Seleccione una fecha inicial válida.' },
  )
  declare from: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Seleccione la fecha final en formato YYYY-MM-DD.',
  })
  @IsDateString(
    { strict: true },
    { message: 'Seleccione una fecha final válida.' },
  )
  declare to: string;

  @Matches(
    /^(?!.*\b(pdf|json|excel)\b.*\b\1\b)(pdf|json|excel)(,(pdf|json|excel))*$/,
    {
      message: 'Seleccione PDF, JSON o Excel sin repetir formatos.',
    },
  )
  declare formats: string;
}
