import { BUILD_GIT_SHA } from './common/consts/build-version.const';
import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { version, name } from '../package.json';

/**
 * Versión del backend (público: sin datos sensibles). El front la muestra
 * junto a la suya para verificar compatibilidad por deploy.
 * Deployment packaging embeds the commit; local builds may use GIT_SHA.
 */
@Controller('version')
export class VersionController {
  private readonly startedAt = new Date().toISOString();

  @Public()
  @Get()
  getVersion() {
    return {
      name,
      version,
      gitSha:
        BUILD_GIT_SHA !== 'local'
          ? BUILD_GIT_SHA
          : (process.env['GIT_SHA'] ?? 'local'),
      startedAt: this.startedAt,
    };
  }
}
