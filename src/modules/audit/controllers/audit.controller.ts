import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuditService } from '../services/audit.service';
import { FilterAuditDto } from '../dto/filter-audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() filter: FilterAuditDto) {
    return this.auditService.findAll(filter);
  }
}
