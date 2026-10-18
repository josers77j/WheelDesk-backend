import { PaginationOptions } from '../interfaces/pagination-options.interface';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/pagination.interface';

type PrismaDelegate<T> = {
  findMany(args?: unknown): Promise<T[]>;
  count(args?: unknown): Promise<number>;
};

export class PaginationBuilder {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly MAX_LIMIT = 100;
  private static readonly MIN_VALUE_PAGINATION = 1;

  private static normalizeParams(
    options?: Partial<PaginationOptions>,
  ): PaginationOptions {
    const page = options?.page ?? this.DEFAULT_PAGE;
    const limit = options?.limit ?? this.DEFAULT_LIMIT;

    const normalizedPage = Math.floor(
      Math.max(this.MIN_VALUE_PAGINATION, page),
    );
    const normalizedLimit = Math.floor(Math.min(this.MAX_LIMIT, limit));

    return {
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  private static calculatePagination(options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    return { skip, take };
  }

  private static calculateMeta(
    params: PaginationOptions,
    total: number,
  ): PaginationMeta {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static async paginate<T>(
    delegate: PrismaDelegate<T>,
    params: Partial<PaginationOptions>,
    findManyArgs?: { where?: unknown },
  ): Promise<PaginatedResponse<T>> {
    const normalizedPagination = this.normalizeParams(params);

    const { skip, take } = this.calculatePagination(normalizedPagination);

    // Execute both queries for better performance
    const [data, total] = await Promise.all([
      delegate.findMany({
        ...findManyArgs,
        skip,
        take,
      }),
      delegate.count({
        where: findManyArgs?.where,
      }),
    ]);

    const meta = this.calculateMeta(normalizedPagination, total);

    return { data, meta };
  }
}
