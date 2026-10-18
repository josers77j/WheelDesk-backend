import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { LoginProtectionService } from '../../auth/services/login-protection.service';

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly loginProtectionService: LoginProtectionService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.usersService.findAll(filterPaginationDto);
  }

  @Get('login-locks')
  findLoginLocks() {
    return this.loginProtectionService.findAll();
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: ContextUser,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Patch('reset-password/:id')
  resetPassword(@Param('id') id: number) {
    return this.usersService.resetPassword(id);
  }

  @Delete('revoke-sessions/:id')
  revokeSessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.revokeSessions(id);
  }

  @Delete('login-locks/:id')
  unlockLoginIp(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: ContextUser,
  ) {
    return this.loginProtectionService.unlock(id, currentUser.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: ContextUser,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}
