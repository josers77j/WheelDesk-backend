import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './modules/auth/auth.module';
import { AppModule } from './app.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
let authModule: AuthModule;
let usersModule: UsersModule;
let prismaModule: PrismaModule;
let commonModule: CommonModule;
describe('AppModule', () => {
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authModule = moduleRef.get<AuthModule>(AuthModule);
    usersModule = moduleRef.get<UsersModule>(UsersModule);
    prismaModule = moduleRef.get<PrismaModule>(PrismaModule);
    commonModule = moduleRef.get<CommonModule>(CommonModule);
  });

  it('should be defined with proper elements', () => {
    expect(authModule).toBeDefined();
    expect(usersModule).toBeDefined();
    expect(prismaModule).toBeDefined();
    expect(commonModule).toBeDefined();
  });
});
