import { prisma } from '../lib/prisma';

export class GroupService {
    /**
     * Get groups with filters and optional pagination
     */
    async getGroups(
        userId: string,
        role: string,
        pagination?: { page: number; limit: number }
    ) {
        const where = role === 'SUPERADMIN' ? {} : { teacherId: userId };

        const include = {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            branch: true,
            _count: {
                select: {
                    students: true,
                    assignments: true,
                },
            },
        };

        // If pagination is provided, return paginated result
        if (pagination) {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                prisma.group.findMany({
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.group.count({ where }),
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

        // Non-paginated (backward compatible)
        return await prisma.group.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create a group with Teacher-Branch validation
     */
    async createGroup(name: string, teacherId: string, branchId?: string) {
        // Validate teacher
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
        });

        if (!teacher) {
            throw new Error('Teacher not found');
        }

        let finalBranchId = branchId;

        // CRM Logic: Consistency check
        if (finalBranchId) {
            // If branch is manually provided, warn or enforce that teacher belongs to it?
            // Rigorous approach: Teacher SHOULD belong to that branch if assigned.
            // But sometimes teachers can teach across branches? 
            // Implementation Plan rule: "If branchId is provided, ensure the Teacher belongs to that Branch"

            if (teacher.branchId && teacher.branchId !== finalBranchId) {
                // Option 1: Error. Option 2: Allow but logging. 
                // Sticking to plan: Enforce consistency.
                // Actually, a teacher might be visiting. But for strict CRM, let's enforce or at least default to teacher's branch.
                // If provided branch differs from teacher's branch, that is suspicious.
                // Let's enforce strict logic: "Group must belong to Teacher's branch if Teacher is assigned to a branch"
                // OR "Teacher must be assigned to the Group's branch".
            }
        } else {
            // Infer from teacher
            finalBranchId = teacher.branchId || undefined;
        }

        // If validation needed:
        if (branchId && teacher.branchId && branchId !== teacher.branchId) {
            throw new Error('Consistency Error: Teacher belongs to a different branch');
        }

        return await prisma.group.create({
            data: {
                name,
                teacherId,
                branchId: finalBranchId,
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                branch: true,
            },
        });
    }

    /**
     * Update group
     */
    async updateGroup(id: string, data: { name?: string; teacherId?: string; branchId?: string | null }, actorId: string, actorRole: string) {
        const existingGroup = await prisma.group.findUnique({ where: { id } });
        if (!existingGroup) {
            throw new Error('Group not found');
        }

        // Permission check
        if (actorRole === 'ADMIN' && existingGroup.teacherId !== actorId) {
            throw new Error('Not authorized to update this group');
        }

        // CRM Logic: If teacher or branch is changing, re-validate
        const newTeacherId = data.teacherId || existingGroup.teacherId;
        const newBranchId = data.branchId !== undefined ? data.branchId : existingGroup.branchId;

        if (newBranchId && newTeacherId) {
            const teacher = await prisma.user.findUnique({ where: { id: newTeacherId } });
            if (teacher && teacher.branchId && teacher.branchId !== newBranchId) {
                throw new Error('Consistency Error: Teacher belongs to a different branch');
            }
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.teacherId) updateData.teacherId = data.teacherId;
        if (data.branchId !== undefined) updateData.branchId = data.branchId;

        return await prisma.group.update({
            where: { id },
            data: updateData,
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                branch: true,
            },
        });
    }

    /**
     * Delete group
     */
    async deleteGroup(id: string, actorId: string, actorRole: string) {
        const existingGroup = await prisma.group.findUnique({ where: { id } });
        if (!existingGroup) {
            throw new Error('Group not found');
        }

        if (actorRole === 'ADMIN' && existingGroup.teacherId !== actorId) {
            throw new Error('Not authorized to delete this group');
        }

        return await prisma.group.delete({ where: { id } });
    }
}

export const groupService = new GroupService();
