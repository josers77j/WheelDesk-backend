import { UpdateCompanyDto } from './../dto/update-company.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCompanySettings() {
    return await this.prismaService.companySettings.findFirst({
      include: {
        district: {
          include: {
            municipality: {
              include: {
                department: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        economicActivity: {
          select: { id: true, name: true },
        },
        responsableDocTypeCatalog: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateCompanySettings(id: number, updateCompanyDto: UpdateCompanyDto) {
    return await this.prismaService.companySettings.update({
      where: {
        id,
      },
      data: updateCompanyDto,
      include: {
        district: {
          include: {
            municipality: {
              include: {
                department: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        economicActivity: {
          select: { id: true, name: true },
        },
        responsableDocTypeCatalog: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
