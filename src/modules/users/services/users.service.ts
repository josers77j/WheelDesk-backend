import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from '../repositories/users.repository';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_PASSWORD_HASH_PATTERN } from '../../../common/utils/password-hash.util';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../interfaces/refresh-token.interface';
import { Prisma } from '../../../../prisma/generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly config: ConfigService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): ReturnType<UserRepository['create']> {
    const defaultPassword = this.encriptedPasswordGenerator();

    return await this.userRepository.create(createUserDto, defaultPassword);
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { name, page, limit, deleted } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.UserWhereInput,
      Prisma.UserOrderByWithRelationInput,
      Prisma.UserInclude,
      Prisma.UserSelect
    > = {};
    const select: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      password: false,
      refreshToken: {
        where: {
          isRevoked: false,
        },
      },
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    paramArgs.orderBy = orderBy;

    const where: Prisma.UserWhereInput = {};

    const paginationOptions: Partial<PaginationOptions> = { limit, page };
    if (name) where.name = { contains: name, mode: 'insensitive' };

    if (deleted !== undefined) where.deletedAt = deleted ? { not: null } : null;

    if (where !== undefined) paramArgs.where = where;

    paramArgs.select = select;

    return await this.userRepository.findAll(paramArgs, paginationOptions);
  }

  async findOneById(id: number) {
    const user = await this.userRepository.finOneById(id);

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user;
  }

  async findOneByIdWithouException(id: number) {
    return await this.userRepository.finOneById(id);
  }

  async findUserByActiveSession(
    userId: number,
    sessionId: string,
  ): ReturnType<UserRepository['findUserByActiveSession']> {
    return this.userRepository.findUserByActiveSession(userId, sessionId);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.finOneByEmail(email);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser?: { id: number },
  ) {
    // Validate whether record exists for given ID
    await this.findOneById(id);

    if (currentUser && id === currentUser.id && updateUserDto.role) {
      throw new ForbiddenException(
        'No puedes cambiar tu propio rol; pídele a otro administrador.',
      );
    }

    return await this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number, currentUser?: { id: number }) {
    const user = await this.findOneById(id);

    if (currentUser && id === currentUser.id) {
      throw new ForbiddenException(
        'No puedes eliminarte a ti mismo; pídele a otro administrador.',
      );
    }

    if (user.role === 'ADMIN') {
      const remainingAdmins = await this.userRepository.countByRole(
        'ADMIN',
        id,
      );
      if (remainingAdmins === 0) {
        throw new ForbiddenException(
          'No puedes eliminar al último administrador del sistema.',
        );
      }
    }

    return await this.userRepository.remove(id);
  }

  async resetPassword(id: number): ReturnType<UserRepository['resetPassword']> {
    await this.findOneById(id);

    const defaultPassword = this.encriptedPasswordGenerator();

    return await this.userRepository.resetPassword(id, defaultPassword);
  }

  async revokeSessions(
    id: string,
  ): ReturnType<UserRepository['revokeUserSessions']> {
    return await this.userRepository.revokeUserSessions(id);
  }

  encriptedPasswordGenerator(password?: string): string {
    if (password !== undefined) return bcrypt.hashSync(password, 12);

    const hash = this.config.get<string>('DEFAULT_PASSWORD_HASH');
    if (!hash || !BCRYPT_PASSWORD_HASH_PATTERN.test(hash)) {
      throw new Error(
        'DEFAULT_PASSWORD_HASH debe contener un hash bcrypt válido.',
      );
    }
    return hash;
  }

  async createRefreshToken(createRefreshToken: RefreshToken) {
    return await this.userRepository.createRefreshToken(createRefreshToken);
  }

  async findUserSession(userId: number) {
    return await this.userRepository.findUserSession(userId);
  }

  async findActiveSessionByTokenHash(tokenHash: string) {
    return await this.userRepository.findActiveSessionByTokenHash(tokenHash);
  }

  async rotateActiveSession(
    sessionId: string,
    previousTokenHash: string,
    nextToken: Omit<RefreshToken, 'id' | 'userId'>,
  ): ReturnType<UserRepository['rotateActiveSession']> {
    return this.userRepository.rotateActiveSession(
      sessionId,
      previousTokenHash,
      nextToken,
    );
  }

  async updateRefreshSessionToRevoke(
    id: string,
  ): ReturnType<UserRepository['updateRefreshSessionToRevoke']> {
    return await this.userRepository.updateRefreshSessionToRevoke(id);
  }
}
