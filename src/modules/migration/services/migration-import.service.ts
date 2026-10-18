import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { Injectable, Logger, Scope } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { AuditService } from '../../audit/services/audit.service';
import { ImportLookupCache } from '../utils/import-lookup-cache';
import { isRecord } from '../../../common/utils/type-guards.util';
import { MigrationImportStrategy, str } from './migration-import-strategy';
import type {
  MigrationFilePayload,
  MigrationFileResult,
} from '../consts/migration-import.const';

export interface MigrationImportError {
  filename: string;
  detail: string;
}

@Injectable({ scope: Scope.REQUEST })
export class MigrationImportService {
  private readonly logger = new Logger('MigrationImport');
  private readonly prefetchedCatalogIds = new Map<string, number>();
  private readonly customerIdsByNit = new Map<string, number>();
  private readonly catalogIds = new ImportLookupCache<number>();
  private readonly documentTypes = new ImportLookupCache<{
    id: number;
    name: string;
  }>();
  private readonly taxDocumentTypes = new ImportLookupCache<{
    id: number;
  } | null>();

  private readonly geographyIds = new ImportLookupCache<{ id: number }>();
  private readonly districtCandidates = new ImportLookupCache<
    { id: number; name: string }[]
  >();
  private readonly productMatchMap = new Map<string, number>();

  private clearBatchCaches(): void {
    this.prefetchedCatalogIds.clear();
    this.customerIdsByNit.clear();
    this.geographyIds.clear();
    this.districtCandidates.clear();
    this.catalogIds.clear();
    this.documentTypes.clear();
    this.taxDocumentTypes.clear();
    this.productMatchMap.clear();
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  async importFiles(
    files: MigrationFilePayload[],
    initialErrors: MigrationImportError[] = [],
    actor?: ContextUser,
  ): Promise<{
    total: number;
    summary: { migrated: number; skipped: number; failed: number };
    errors: MigrationImportError[];
  }> {
    const summary = { migrated: 0, skipped: 0, failed: initialErrors.length };
    const errors: MigrationImportError[] = [...initialErrors];
    this.clearBatchCaches();
    // Batch-scoped strategy shares these caches by reference; its rollback
    // path clears them through the same callback used at batch boundaries.
    const strategy = new MigrationImportStrategy(
      this.prisma,
      this.storageService,
      {
        prefetchedCatalogIds: this.prefetchedCatalogIds,
        customerIdsByNit: this.customerIdsByNit,
        catalogIds: this.catalogIds,
        documentTypes: this.documentTypes,
        taxDocumentTypes: this.taxDocumentTypes,
        geographyIds: this.geographyIds,
        districtCandidates: this.districtCandidates,
        productMatchMap: this.productMatchMap,
      },
      () => this.clearBatchCaches(),
      actor?.id,
    );
    await this.prefetchCatalogs(files);
    for (const file of files) {
      let result: MigrationFileResult;
      try {
        result = await strategy.importOne(file);
      } catch (error: unknown) {
        result = {
          filename: file.filename,
          status: 'error',
          detail: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
      if (result.status === 'error') {
        summary.failed += 1;
        errors.push({ filename: result.filename, detail: result.detail });
      } else {
        summary[result.status] += 1;
      }
    }
    this.clearBatchCaches();
    await this.auditService.log({
      userId: actor?.id,
      action: 'migration.import',
      entityType: 'migration-batch',
      entityId: randomUUID(),
      metadata: {
        ...summary,
        errors,
        ...(actor ? { actorName: actor.name } : {}),
      },
    });
    return { total: files.length + initialErrors.length, summary, errors };
  }

  private async prefetchCatalogs(files: MigrationFilePayload[]): Promise<void> {
    const items = new Set<string>();
    const units = new Set<string>();
    const activities = new Set<string>();
    for (const file of files) {
      try {
        const raw: unknown = JSON.parse(file.jsonBuffer.toString('utf-8'));
        if (!isRecord(raw)) continue;
        if (Array.isArray(raw.cuerpoDocumento)) {
          for (const item of raw.cuerpoDocumento) {
            if (!isRecord(item)) continue;
            items.add(str(item.tipoItem) || '1');
            units.add(str(item.uniMedida) || '59');
          }
        }
        if (isRecord(raw.receptor) && str(raw.receptor.nit)) {
          const activity = str(raw.receptor.codActividad);
          // Empty activity codes use the legacy-only resolver, not this lookup.
          if (activity) activities.add(activity);
        }
      } catch {
        // Each document retains its existing validation and error response.
      }
    }
    await this.prefetchCatalogCodes('item', items, (codes) =>
      this.prisma.electronicInvoiceItemTypeCatalog.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true },
      }),
    );
    await this.prefetchCatalogCodes('unit', units, (codes) =>
      this.prisma.electronicInvoiceUnitOfMeasureCatalog.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true },
      }),
    );
    await this.prefetchCatalogCodes('activity', activities, (codes) =>
      this.prisma.electronicInvoiceEconomicActivityCatalog.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true },
      }),
    );
  }

  private async prefetchCatalogCodes(
    prefix: string,
    codes: Set<string>,
    load: (codes: string[]) => Promise<{ id: number; code: string | null }[]>,
  ): Promise<void> {
    // A single code already costs one query through the batch cache.
    if (codes.size < 2) return;
    try {
      for (const row of await load([...codes])) {
        if (row.code !== null && codes.has(row.code)) {
          this.prefetchedCatalogIds.set(`${prefix}:${row.code}`, row.id);
        }
      }
    } catch {
      // Prefetch is optional: retain per-document lookup, errors and rollback.
      this.logger.warn('Catalog prefetch failed; using document lookups.');
    }
  }
}
