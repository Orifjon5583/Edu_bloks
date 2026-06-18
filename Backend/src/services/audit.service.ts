import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Local definition of AuditAction enum (stored as String in DB)
export enum AuditAction {
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',
    USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
    GROUP_CREATE = 'GROUP_CREATE',
    GROUP_UPDATE = 'GROUP_UPDATE',
    GROUP_DELETE = 'GROUP_DELETE',
    ASSIGNMENT_CREATE = 'ASSIGNMENT_CREATE',
    ASSIGNMENT_UPDATE = 'ASSIGNMENT_UPDATE',
    ASSIGNMENT_DELETE = 'ASSIGNMENT_DELETE',
    ASSIGNMENT_PUBLISH = 'ASSIGNMENT_PUBLISH',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
}

export interface AuditLogParams {
    action: AuditAction;
    actorId: string;
    actorRole: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Log an action to the audit trail
     */
    async log(params: AuditLogParams): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    action: params.action,
                    actorId: params.actorId,
                    actorRole: params.actorRole,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    metadata: params.metadata ?? Prisma.JsonNull,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                },
            });
        } catch (error) {
            // Don't fail the main operation if audit logging fails
            console.error('Audit log error:', error);
        }
    }

    /**
     * Get audit logs with filters and pagination
     */
    async getLogs(
        filters: {
            actorId?: string;
            entityType?: string;
            entityId?: string;
            action?: AuditAction;
            from?: Date;
            to?: Date;
        },
        pagination?: { page: number; limit: number }
    ) {
        const where: any = {};

        if (filters.actorId) where.actorId = filters.actorId;
        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.entityId) where.entityId = filters.entityId;
        if (filters.action) where.action = filters.action;

        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) where.createdAt.gte = filters.from;
            if (filters.to) where.createdAt.lte = filters.to;
        }

        const select = {
            id: true,
            action: true,
            actorId: true,
            actorRole: true,
            entityType: true,
            entityId: true,
            metadata: true,
            ipAddress: true,
            createdAt: true,
        };

        if (pagination) {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                // @ts-ignore - auditLog will exist after prisma generate
                prisma.auditLog.findMany({
                    where,
                    select,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                // @ts-ignore - auditLog will exist after prisma generate
                prisma.auditLog.count({ where }),
            ]);

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

        // @ts-ignore - auditLog will exist after prisma generate
        return await prisma.auditLog.findMany({
            where,
            select,
            orderBy: { createdAt: 'desc' },
            take: 100, // Default limit for safety
        });
    }
}

export const auditService = new AuditService();

// Helper for quick logging in routes
export function createAuditLogger(req: { ip?: string; get?: (header: string) => string | undefined }) {
    return {
        ip: req.ip || (req.get ? req.get('x-forwarded-for') : undefined),
        userAgent: req.get ? req.get('user-agent') : undefined,
    };
}
