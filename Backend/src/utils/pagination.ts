/**
 * Pagination utility types and helpers
 */

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Parse pagination params from query string
 */
export function parsePaginationParams(query: { page?: string; limit?: string }): PaginationParams {
    let page = parseInt(query.page || String(DEFAULT_PAGE), 10);
    let limit = parseInt(query.limit || String(DEFAULT_LIMIT), 10);

    // Validate
    if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    return { page, limit };
}

/**
 * Calculate pagination metadata
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResult<T> {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Get skip value for Prisma query
 */
export function getSkip(params: PaginationParams): number {
    return (params.page - 1) * params.limit;
}
