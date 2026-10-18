import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { MigrationController } from './migration.controller';
import { MigrationService } from '../services/migration.service';
import { MigrationImportService } from '../services/migration-import.service';
import { MigrationUnlockService } from '../services/migration-unlock.service';
import { MigrationUnlockGuard } from '../guards/migration-unlock.guard';
import { MAX_MIGRATION_PDF_BYTES } from '../consts/migration-import.const';

describe('migration upload limits', () => {
  let app: INestApplication<Server>;
  const preview = jest.fn().mockReturnValue({});
  const importFiles = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MigrationController],
      providers: [
        { provide: MigrationService, useValue: { preview } },
        { provide: MigrationImportService, useValue: { importFiles } },
        { provide: MigrationUnlockService, useValue: {} },
      ],
    })
      .overrideGuard(MigrationUnlockGuard)
      .useValue({ canActivate: (): boolean => true })
      .compile();
    app = module.createNestApplication<INestApplication<Server>>();
    await app.listen(0, '127.0.0.1');
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  it.each(['preview', 'import'])(
    'rejects oversized %s uploads before service dispatch',
    async (endpoint) => {
      await request(app.getHttpServer())
        .post(`/migration/invoices/${endpoint}`)
        .attach(
          'files',
          Buffer.alloc(MAX_MIGRATION_PDF_BYTES + 1),
          'example.pdf',
        )
        .expect(413);
      expect(preview).not.toHaveBeenCalled();
      expect(importFiles).not.toHaveBeenCalled();
    },
  );
  it('allows an upload exactly at the limit', async () => {
    await request(app.getHttpServer())
      .post('/migration/invoices/preview')
      .attach('files', Buffer.alloc(MAX_MIGRATION_PDF_BYTES), 'example.pdf')
      .expect(201);
    expect(preview).toHaveBeenCalledTimes(1);
  });
});
