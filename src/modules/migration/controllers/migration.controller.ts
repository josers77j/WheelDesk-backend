import {
  Controller,
  Body,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MigrationService } from '../services/migration.service';
import { MigrationImportService } from '../services/migration-import.service';
import { MAX_MIGRATION_PDF_BYTES } from '../consts/migration-import.const';
import { pairUploads } from '../utils/upload-pairing.util';
import { MigrationUnlockService } from '../services/migration-unlock.service';
import { MigrationUnlockGuard } from '../guards/migration-unlock.guard';

@Roles(UserRole.ADMIN)
@Controller('migration')
export class MigrationController {
  constructor(
    private readonly migrationService: MigrationService,
    private readonly importService: MigrationImportService,
    private readonly migrationUnlockService: MigrationUnlockService,
  ) {}

  @Post('unlock')
  unlock(@Body() body: { password?: string }) {
    return this.migrationUnlockService.unlock(body.password ?? '');
  }

  @Post('unlock/refresh')
  @UseGuards(MigrationUnlockGuard)
  refreshUnlock() {
    return this.migrationUnlockService.issueToken();
  }

  @UseGuards(MigrationUnlockGuard)
  @Get('invoices/verify')
  verifyFiles() {
    return this.migrationService.verifyLegacyFiles();
  }

  @UseGuards(MigrationUnlockGuard)
  @Post('invoices/preview')
  @UseInterceptors(
    FilesInterceptor('files', 400, {
      limits: {
        // Busboy raises its limit event at equality; allow the documented maximum.
        fileSize: MAX_MIGRATION_PDF_BYTES + 1,
        files: 400,
      },
    }),
  )
  preview(@UploadedFiles() files: Express.Multer.File[]) {
    return this.migrationService.preview(files ?? []);
  }

  // Complete the batch before responding; no worker or progress stream is required.
  @UseGuards(MigrationUnlockGuard)
  @Post('invoices/import')
  @UseInterceptors(
    FilesInterceptor('files', 400, {
      limits: {
        // Busboy raises its limit event at equality; allow the documented maximum.
        fileSize: MAX_MIGRATION_PDF_BYTES + 1,
        files: 400,
      },
    }),
  )
  async import(
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: ContextUser,
  ): Promise<
    Awaited<ReturnType<MigrationImportService['importFiles']>> & {
      orphans: string[];
      attached: { stem: string; controlNumber: string }[];
    }
  > {
    const { pairs, orphanFiles } = pairUploads(files ?? []);
    const attached: { stem: string; controlNumber: string }[] = [];
    const stillOrphans: string[] = [];
    const orphanErrors: { filename: string; detail: string }[] = [];
    for (const file of orphanFiles) {
      if (file.buffer.length > MAX_MIGRATION_PDF_BYTES) {
        orphanErrors.push({
          filename: file.originalname,
          detail: 'El PDF supera el tamaño máximo permitido de 512 KB.',
        });
        continue;
      }
      try {
        const result = await this.migrationService.attachOrphanPdfs([file]);
        attached.push(...result.attached);
        stillOrphans.push(...result.stillOrphans);
      } catch {
        orphanErrors.push({
          filename: file.originalname,
          detail: 'No se pudo adjuntar el PDF. Intenta nuevamente.',
        });
      }
    }
    const result = await this.importService.importFiles(
      pairs.map((pair) => ({
        filename: pair.json.originalname,
        jsonBuffer: pair.json.buffer,
        pdfBuffer: pair.pdf ? pair.pdf.buffer : null,
        pdfFilename: pair.pdf ? pair.pdf.originalname : null,
      })),
      orphanErrors,
      user,
    );
    return { ...result, orphans: stillOrphans, attached };
  }
}
