import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ContextUser } from '../interfaces/context-user.interface';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: ContextUser }>();
    return request.user;
  },
);
