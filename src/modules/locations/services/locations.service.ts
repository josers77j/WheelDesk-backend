import { Injectable } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';
import { DistrictFilterDto } from './../dtos/district-filter.dto';
import { MunicipalityFilterDto } from '../dtos/municipality-filter.dto';
import { Prisma } from '../../../../prisma/generated/prisma/client';

@Injectable()
export class LocationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDepartments(filter: string) {
    const id = +filter;
    const where: Prisma.DepartmentWhereInput = {};

    if (!Number.isNaN(id) && filter) {
      where.id = id;
    }

    if (Number.isNaN(id)) {
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };
    }

    return await this.prismaService.department.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getMunicipality(municipalityFilterDto: MunicipalityFilterDto) {
    const { departmentId, filter } = municipalityFilterDto;

    if (!departmentId) return [];

    const id = +filter;
    const where: Prisma.MunicipalityWhereInput = {};

    where.departmentId = departmentId;

    if (!Number.isNaN(id) && filter) {
      where.id = id;
    }

    if (Number.isNaN(id)) {
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };
    }

    return await this.prismaService.municipality.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getDistrict(districtFilterDto: DistrictFilterDto) {
    const { municipalityId, filter } = districtFilterDto;

    if (!municipalityId) return [];

    const id = +filter;
    const where: Prisma.DistrictWhereInput = {};

    where.municipalityId = municipalityId;

    if (!Number.isNaN(id) && filter) {
      where.id = id;
    }

    if (Number.isNaN(id)) {
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };
    }

    return await this.prismaService.district.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
    });
  }
}
