import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';

@Roles(UserRole.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('period')
  period(): ReturnType<DashboardService['period']> {
    return this.dashboardService.period();
  }

  @Get('summary')
  getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query);
  }
}
