import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from '../services/locations.service';
import { MunicipalityFilterDto } from '../dtos/municipality-filter.dto';
import { DistrictFilterDto } from '../dtos/district-filter.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('department')
  getDepartments(@Query('filter') filter: string) {
    return this.locationsService.getDepartments(filter);
  }

  @Get('municipality')
  getMunicipality(@Query() municipalityFilterDto: MunicipalityFilterDto) {
    return this.locationsService.getMunicipality(municipalityFilterDto);
  }

  @Get('district')
  getDistrict(@Query() districtFilterDto: DistrictFilterDto) {
    return this.locationsService.getDistrict(districtFilterDto);
  }
}
