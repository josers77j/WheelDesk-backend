/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtGuard } from './jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let reflector: Reflector;

  const mockExecutionContext = (): jest.Mocked<ExecutionContext> => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtGuard(reflector);
  });

  it('should allow access when route is public', () => {
    const mockContext = mockExecutionContext();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const parentCanActivateSpy = jest.spyOn(
      AuthGuard('jwt').prototype,
      'canActivate',
    );

    const result = guard.canActivate(mockContext);

    // ASSERT
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
    expect(parentCanActivateSpy).not.toHaveBeenCalled();
  });

  it('should call super.canActivate when route is not public', async () => {
    // ARRANGE
    const mockContext = mockExecutionContext();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const parentCanActivateSpy = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(true);

    // ACT
    await guard.canActivate(mockContext);

    // ASSERT
    expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should return false when parent canActivate denies access', async () => {
    // ARRANGE
    const mockContext = mockExecutionContext();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(false);

    // ACT
    const result = await guard.canActivate(mockContext);

    // ASSERT
    expect(result).toBe(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
