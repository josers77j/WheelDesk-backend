import { Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AccountingReportQueryDto } from '../dto/accounting-report-query.dto';
import { AccountingReportsService } from '../services/accounting-reports.service';

@Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
@Controller('accounting-reports')
export class AccountingReportsController {
  constructor(private readonly reports: AccountingReportsService) {}

  @Get('period')
  period(): ReturnType<AccountingReportsService['period']> {
    return this.reports.period();
  }

  @Post('export')
  export(
    @Query() query: AccountingReportQueryDto,
  ): ReturnType<AccountingReportsService['export']> {
    return this.reports.export(query);
  }
}
