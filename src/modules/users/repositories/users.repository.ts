import { CreateUserDto } from './../dto/create-user.dto';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';

import { DateTime } from 'luxon';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { Prisma, UserRole } from '../../../../prisma/generated/prisma/client';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import {
  RefreshToken,
  RefreshTokenResponse,
} from '../interfaces/refresh-token.interface';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto, defaultPassword: string) {
    return await this.prismaService.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role ?? UserRole.VIEWER,
        password: defaultPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.UserWhereInput,
      Prisma.UserOrderByWithRelationInput,
      Prisma.UserInclude,
      Prisma.UserSelect
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.user,
      paginationOptions,
      paramArgs,
    );
  }

  async finOneById(id: number) {
    return await this.prismaService.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findUserByActiveSession(
    userId: number,
    sessionId: string,
  ): Promise<Omit<ContextUser, 'sessionId'> | null> {
    return this.prismaService.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
        refreshToken: {
          some: {
            id: sessionId,
            isRevoked: false,
            expiresAt: { gt: DateTime.now().toJSDate() },
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async finOneByEmail(email: string) {
    return await this.prismaService.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    return await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: DateTime.local().toString(),
      },
    });
  }

  async countByRole(role: UserRole, excludeId?: number) {
    return await this.prismaService.user.count({
      where: {
        role,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async resetPassword(id: number, defaultPassword: string) {
    return await this.prismaService.user.update({
      where: { id },
      data: { password: defaultPassword },
    });
  }

  async revokeUserSessions(id: string) {
    return await this.prismaService.refreshTokens.updateMany({
      where: {
        id,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async createRefreshToken(createRefreshToken: RefreshToken) {
    return await this.prismaService.refreshTokens.create({
      data: createRefreshToken,
    });
  }

  async findUserSession(userId: number): Promise<RefreshTokenResponse[]> {
    return await this.prismaService.refreshTokens.findMany({
      where: {
        isRevoked: false,
        userId,
        expiresAt: {
          gt: DateTime.now().toJSDate(),
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findActiveSessionByTokenHash(
    tokenHash: string,
  ): Promise<RefreshTokenResponse | null> {
    return await this.prismaService.refreshTokens.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: {
          gt: DateTime.now().toJSDate(),
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async rotateActiveSession(
    sessionId: string,
    previousTokenHash: string,
    nextToken: Omit<RefreshToken, 'id' | 'userId'>,
  ): Promise<{ count: number }> {
    return this.prismaService.refreshTokens.updateMany({
      where: {
        id: sessionId,
        tokenHash: previousTokenHash,
        isRevoked: false,
        expiresAt: { gt: DateTime.now().toJSDate() },
        user: { deletedAt: null },
      },
      data: nextToken,
    });
  }

  async updateRefreshSessionToRevoke(id: string) {
    return await this.prismaService.refreshTokens.update({
      where: {
        id,
      },
      data: {
        isRevoked: true,
      },
    });
  }
}
