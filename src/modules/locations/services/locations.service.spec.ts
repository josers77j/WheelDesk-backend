import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { PrismaService } from './../../../prisma/prisma.service';
import { DistrictFilterDto } from '../dtos/district-filter.dto';
import { MunicipalityFilterDto } from '../dtos/municipality-filter.dto';

type DepartmentFindManyMethod = PrismaService['department']['findMany'];
type MunicipalityFindManyMethod = PrismaService['municipality']['findMany'];
type DistrictFindManyMethod = PrismaService['district']['findMany'];

describe('LocationsService', () => {
  let service: LocationsService;
  let departmentFindManyMock: jest.MockedFunction<DepartmentFindManyMethod>;
  let municipalityFindManyMock: jest.MockedFunction<MunicipalityFindManyMethod>;
  let districtFindManyMock: jest.MockedFunction<DistrictFindManyMethod>;

  const mockDepartment = {
    id: 1,
    name: 'San Salvador',
    code: '01',
    externalCode: 'SS',
    createdAt: new Date(),
  };
  const mockMunicipality = {
    id: 1,
    name: 'San Salvador',
    departmentId: 1,
    code: '0101',
    externalCode: 'SS',
    createdAt: new Date(),
  };
  const mockDistrict = {
    id: 1,
    name: 'Distrito Test',
    municipalityId: 1,
    code: '010101',
    agentCode: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    departmentFindManyMock = jest.fn();
    municipalityFindManyMock = jest.fn();
    districtFindManyMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: PrismaService,
          useValue: {
            department: { findMany: departmentFindManyMock },
            municipality: { findMany: municipalityFindManyMock },
            district: { findMany: districtFindManyMock },
          },
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDepartments', () => {
    it('retorna todos los departamentos cuando filter está vacío', async () => {
      departmentFindManyMock.mockResolvedValue([mockDepartment]);

      const result = await service.getDepartments('');

      expect(departmentFindManyMock).toHaveBeenCalledWith({
        where: {},
        select: { id: true, name: true },
      });
      expect(result).toEqual([mockDepartment]);
    });

    it('filtra por id cuando filter es numérico', async () => {
      departmentFindManyMock.mockResolvedValue([mockDepartment]);

      const result = await service.getDepartments('1');

      expect(departmentFindManyMock).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, name: true },
      });
      expect(result).toEqual([mockDepartment]);
    });

    it('filtra por nombre cuando filter es texto', async () => {
      departmentFindManyMock.mockResolvedValue([mockDepartment]);

      const result = await service.getDepartments('San');

      expect(departmentFindManyMock).toHaveBeenCalledWith({
        where: { name: { contains: 'San', mode: 'insensitive' } },
        select: { id: true, name: true },
      });
      expect(result).toEqual([mockDepartment]);
    });
  });

  describe('getMunicipality', () => {
    it('retorna array vacío cuando no hay departmentId', async () => {
      const filterDto: MunicipalityFilterDto = {
        departmentId: 0,
        filter: 'test',
      };

      const result = await service.getMunicipality(filterDto);

      expect(result).toEqual([]);
      expect(municipalityFindManyMock).not.toHaveBeenCalled();
    });

    it('retorna municipios filtrados por departmentId', async () => {
      const filterDto: MunicipalityFilterDto = { departmentId: 1, filter: '' };
      municipalityFindManyMock.mockResolvedValue([mockMunicipality]);

      const result = await service.getMunicipality(filterDto);

      expect(municipalityFindManyMock).toHaveBeenCalledWith({
        where: { departmentId: 1 },
        select: { id: true, name: true },
      });
      expect(result).toEqual([mockMunicipality]);
    });

    it('filtra por id cuando filter es numérico', async () => {
      const filterDto: MunicipalityFilterDto = { departmentId: 1, filter: '5' };
      municipalityFindManyMock.mockResolvedValue([mockMunicipality]);

      await service.getMunicipality(filterDto);

      expect(municipalityFindManyMock).toHaveBeenCalledWith({
        where: { departmentId: 1, id: 5 },
        select: { id: true, name: true },
      });
    });

    it('filtra por nombre cuando filter es texto', async () => {
      const filterDto: MunicipalityFilterDto = {
        departmentId: 1,
        filter: 'San',
      };
      municipalityFindManyMock.mockResolvedValue([mockMunicipality]);

      await service.getMunicipality(filterDto);

      expect(municipalityFindManyMock).toHaveBeenCalledWith({
        where: {
          departmentId: 1,
          name: { contains: 'San', mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });
    });
  });

  describe('getDistrict', () => {
    it('retorna array vacío cuando no hay municipalityId', async () => {
      const filterDto: DistrictFilterDto = {
        municipalityId: 0,
        filter: 'test',
      };

      const result = await service.getDistrict(filterDto);

      expect(result).toEqual([]);
      expect(districtFindManyMock).not.toHaveBeenCalled();
    });

    it('retorna distritos filtrados por municipalityId', async () => {
      const filterDto: DistrictFilterDto = { municipalityId: 1, filter: '' };
      districtFindManyMock.mockResolvedValue([mockDistrict]);

      const result = await service.getDistrict(filterDto);

      expect(districtFindManyMock).toHaveBeenCalledWith({
        where: { municipalityId: 1 },
        select: { id: true, name: true },
      });
      expect(result).toEqual([mockDistrict]);
    });

    it('filtra por id cuando filter es numérico', async () => {
      const filterDto: DistrictFilterDto = { municipalityId: 1, filter: '3' };
      districtFindManyMock.mockResolvedValue([mockDistrict]);

      await service.getDistrict(filterDto);

      expect(districtFindManyMock).toHaveBeenCalledWith({
        where: { municipalityId: 1, id: 3 },
        select: { id: true, name: true },
      });
    });

    it('filtra por nombre cuando filter es texto', async () => {
      const filterDto: DistrictFilterDto = {
        municipalityId: 1,
        filter: 'Centro',
      };
      districtFindManyMock.mockResolvedValue([mockDistrict]);

      await service.getDistrict(filterDto);

      expect(districtFindManyMock).toHaveBeenCalledWith({
        where: {
          municipalityId: 1,
          name: { contains: 'Centro', mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });
    });
  });
});
