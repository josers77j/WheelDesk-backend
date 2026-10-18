import { JwtGuard } from './../../modules/auth/guards/jwt.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth() {
  return applyDecorators(UseGuards(JwtGuard));
}
