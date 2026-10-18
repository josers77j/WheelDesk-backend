import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import type { MigrationFilePayload } from '../consts/migration-import.const';
import { Test } from '@nestjs/testing';
import { MigrationController } from './migration.controller';
import { MigrationService } from '../services/migration.service';
import { MigrationImportService } from '../services/migration-import.service';
import { MigrationUnlockService } from '../services/migration-unlock.service';
import { Readable } from 'stream';

const upload = (originalname: string, buffer: Buffer): Express.Multer.File => ({
  originalname,
  buffer,
  fieldname: 'files',
  encoding: '7bit',
  mimetype: 'application/octet-stream',
  size: buffer.length,
  stream: Readable.from(buffer),
  destination: '',
  filename: originalname,
  path: '',
});

describe('MigrationController import', () => {
  const actor: ContextUser = {
    id: 27,
    name: 'Importer',
    email: 'importer@example.test',
    role: 'ADMIN',
  };
  let controller: MigrationController;
  let attach: jest.Mock;
  let importFiles: jest.Mock<
    Promise<unknown>,
    [MigrationFilePayload[], { filename: string; detail: string }[]]
  >;
  beforeEach(async () => {
    attach = jest.fn().mockResolvedValue({ attached: [], stillOrphans: [] });
    importFiles = jest
      .fn<
        Promise<unknown>,
        [MigrationFilePayload[], { filename: string; detail: string }[]]
      >()
      .mockImplementation(
        (files: unknown[], errors: { filename: string; detail: string }[]) =>
          Promise.resolve({
            total: files.length + errors.length,
            summary: {
              migrated: files.length,
              skipped: 0,
              failed: errors.length,
            },
            errors,
          }),
      );
    const module = await Test.createTestingModule({
      controllers: [MigrationController],
      providers: [
        { provide: MigrationService, useValue: { attachOrphanPdfs: attach } },
        { provide: MigrationImportService, useValue: { importFiles } },
        { provide: MigrationUnlockService, useValue: {} },
      ],
    }).compile();
    controller = module.get(MigrationController);
  });

  it('passes original buffers directly and reports oversized orphan PDFs without blocking paired documents', async () => {
    const json = Buffer.from('{"identificacion":{"codigoGeneracion":"abc"}}');
    const pdf = Buffer.from('%PDF original');
    const result = await controller.import(
      [
        upload('invoice.json', json),
        upload('invoice.pdf', pdf),
        upload('oversized.pdf', Buffer.alloc(512 * 1024 + 1)),
      ],
      actor,
    );
    expect(attach).not.toHaveBeenCalled();
    expect(importFiles).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      actor,
    );
    expect(importFiles.mock.calls[0][0][0].jsonBuffer).toBe(json);
    expect(importFiles.mock.calls[0][0][0].pdfBuffer).toBe(pdf);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors).toEqual([
      {
        filename: 'oversized.pdf',
        detail: 'El PDF supera el tamaño máximo permitido de 512 KB.',
      },
    ]);
    expect(result).not.toHaveProperty('results');
  });

  it('continues with later orphan PDFs and JSON when one attachment fails', async () => {
    attach
      .mockRejectedValueOnce(new Error('internal details'))
      .mockResolvedValueOnce({
        attached: [{ stem: 'good', controlNumber: 'DTE-1' }],
        stillOrphans: [],
      });
    const result = await controller.import(
      [
        upload('bad.pdf', Buffer.from('%PDF')),
        upload('good.pdf', Buffer.from('%PDF')),
        upload('invoice.json', Buffer.from('{}')),
      ],
      actor,
    );
    expect(attach).toHaveBeenCalledTimes(2);
    expect(result.attached).toEqual([{ stem: 'good', controlNumber: 'DTE-1' }]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors).toEqual([
      {
        filename: 'bad.pdf',
        detail: 'No se pudo adjuntar el PDF. Intenta nuevamente.',
      },
    ]);
  });
});
