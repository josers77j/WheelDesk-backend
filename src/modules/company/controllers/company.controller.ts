import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { UpdateCompanyDto } from '../dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  getCompanySettings() {
    return this.companyService.getCompanySettings();
  }

  @Patch(':id')
  updateCompanySettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompanySettings(id, updateCompanyDto);
  }
}
