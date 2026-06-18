import { prisma } from '../lib/prisma';

export class AssignmentService {
    async getAssignments(
        userId: string,
        role: string,
        status?: string,
        pagination?: { page: number; limit: number }
    ) {
        const where: any = {};
        if (role === 'ADMIN') {
            where.createdById = userId;
        }
        if (status) {
            where.status = status;
        }

        const include = {
            createdBy: {
                select: { id: true, firstName: true, lastName: true },
            },
            groups: {
                select: { id: true, name: true },
            },
            _count: {
                select: { studentAssignments: true },
            },
        };

        // If pagination is provided, return paginated result
        if (pagination) {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                prisma.assignment.findMany({
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.assignment.count({ where }),
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
        return await prisma.assignment.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAssignmentById(id: string, userId: string, role: string) {
        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                groups: {
                    select: { id: true, name: true },
                },
                assignedStudents: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        if (role === 'ADMIN' && assignment.createdById !== userId) {
            throw new Error('Not authorized');
        }

        return assignment;
    }

    async getAssignmentResults(assignmentId: string, userId: string, role: string) {
        // Check access
        await this.getAssignmentById(assignmentId, userId, role);

        return await prisma.studentAssignment.findMany({
            where: { assignmentId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        login: true,
                        group: { select: { name: true } }
                    }
                },
                submissions: {
                    orderBy: { submittedAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { student: { lastName: 'asc' } }
        });
    }

    async createAssignment(data: any, userId: string) {
        const { title, description, type, content, dueAt, groupIds, studentIds, status } = data;

        console.log('Creating assignment with content:', JSON.stringify(content, null, 2));

        const finalStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

        return await prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.create({
                data: {
                    title,
                    description: description || null,
                    type,
                    content,
                    createdById: userId,
                    dueAt: new Date(dueAt),
                    status: finalStatus,
                    isPublic: data.isPublic || false,
                    tags: data.tags || [],
                    groups: {
                        connect: groupIds ? groupIds.map((id: string) => ({ id })) : [],
                    },
                    assignedStudents: {
                        connect: studentIds ? studentIds.map((id: string) => ({ id })) : [],
                    }
                },
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    groups: {
                        select: { id: true, name: true },
                    },
                    assignedStudents: {
                        select: { id: true, firstName: true, lastName: true },
                    }
                },
            });

            // If published immediately, create student assignments
            if (finalStatus === 'PUBLISHED') {
                const targetStudentIds = new Set<string>();

                if (groupIds && groupIds.length > 0) {
                    const studentsInGroups = await tx.user.findMany({
                        where: { groupId: { in: groupIds }, role: 'STUDENT' },
                        select: { id: true }
                    });
                    studentsInGroups.forEach(s => targetStudentIds.add(s.id));
                }

                if (studentIds && studentIds.length > 0) {
                    studentIds.forEach((id: string) => targetStudentIds.add(id));
                }

                if (targetStudentIds.size > 0) {
                    await tx.studentAssignment.createMany({
                        data: Array.from(targetStudentIds).map(studentId => ({
                            assignmentId: assignment.id,
                            studentId: studentId,
                            status: 'NEW'
                        })),
                        skipDuplicates: true
                    });
                }
            }

            return assignment;
        });
    }

    async updateAssignment(id: string, data: any, userId: string, role: string) {
        const existing = await prisma.assignment.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Assignment not found');
        }

        if (role === 'ADMIN' && existing.createdById !== userId) {
            throw new Error('Not authorized');
        }

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type) updateData.type = data.type;
        if (data.content) updateData.content = data.content;
        if (data.dueAt) updateData.dueAt = new Date(data.dueAt);
        if (data.status) updateData.status = data.status;
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
        if (data.tags) updateData.tags = data.tags;

        // Handle updating groups/students if providing them (this implies resetting connections if passed)
        // Usually update might just add/remove, but for simple logic let's just support full replacement if array provided
        // But the validator schema makes them optional.

        // Actually `updateAssignment` in routes receives `updateAssignmentSchema` which doesn't include groupIds/studentIds by default in existing code?
        // Let's check validator again. The `updateAssignmentSchema` does NOT include groupIds/studentIds.
        // So we can't update them via PUT /:id unless we add them to schema.
        // But primarily "Publish" is used to assign.
        // If the user wants to "Re-assign" or "Give to another group", we likely use a separate endpoint or just Publish again?
        // Publish endpoint is `/:id/publish`.
        // Let's stick to updateData only here.

        return await prisma.$transaction(async (tx) => {
            // 1. Update assignment basic info and relations
            if (data.groupIds) {
                updateData.groups = { set: data.groupIds.map((id: string) => ({ id })) };
            }
            if (data.studentIds) {
                updateData.assignedStudents = { set: data.studentIds.map((id: string) => ({ id })) };
            }

            const assignment = await tx.assignment.update({
                where: { id },
                data: updateData,
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    groups: { select: { id: true } },
                    assignedStudents: { select: { id: true } } // Direct students
                },
            });

            // 2. If assignment is PUBLISHED, ensure all assigned students have StudentAssignment records.
            //    We do NOT delete records for students removed (to preserve history).
            //    We only add for new ones.

            if (assignment.status === 'PUBLISHED') {
                const targetStudentIds = new Set<string>();

                // Get IDs from groups
                if (assignment.groups.length > 0) {
                    const groupIds = assignment.groups.map(g => g.id);
                    const studentsInGroups = await tx.user.findMany({
                        where: { groupId: { in: groupIds }, role: 'STUDENT' },
                        select: { id: true }
                    });
                    studentsInGroups.forEach(s => targetStudentIds.add(s.id));
                }

                // Get IDs from direct assignment
                if (assignment.assignedStudents && assignment.assignedStudents.length > 0) {
                    assignment.assignedStudents.forEach((s: any) => targetStudentIds.add(s.id));
                }

                if (targetStudentIds.size > 0) {
                    await tx.studentAssignment.createMany({
                        data: Array.from(targetStudentIds).map(studentId => ({
                            assignmentId: id,
                            studentId: studentId,
                            status: 'NEW'
                        })),
                        skipDuplicates: true
                    });
                }
            }

            return assignment;
        });
    }

    async publishAssignment(id: string, groupIds: string[] | undefined, studentIds: string[] | undefined, userId: string, role: string) {
        // Use transaction to ensure atomicity - all or nothing
        return await prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.findUnique({ where: { id } });
            if (!assignment) {
                throw new Error('Assignment not found');
            }

            if (role === 'ADMIN' && assignment.createdById !== userId) {
                throw new Error('Not authorized');
            }

            const targetStudentIds = new Set<string>();

            // Handle Groups
            if (groupIds && groupIds.length > 0) {
                // Validate groups
                const groups = await tx.group.findMany({
                    where: { id: { in: groupIds } },
                    select: { id: true },
                });

                if (groups.length !== groupIds.length) {
                    throw new Error('One or more groups not found');
                }

                // Get students
                const studentsInGroups = await tx.user.findMany({
                    where: {
                        groupId: { in: groupIds },
                        role: 'STUDENT',
                    },
                });
                studentsInGroups.forEach(s => targetStudentIds.add(s.id));
            }

            // Handle Direct Students
            if (studentIds && studentIds.length > 0) {
                // Validate students (optional but good)
                const students = await tx.user.findMany({
                    where: { id: { in: studentIds }, role: 'STUDENT' },
                    select: { id: true }
                });

                if (students.length !== studentIds.length) {
                    // We could error or just ignore missing ones. Let's error for safety.
                    throw new Error('One or more students not found');
                }
                students.forEach(s => targetStudentIds.add(s.id));
            }

            // Create student assignments atomically
            if (targetStudentIds.size > 0) {
                await tx.studentAssignment.createMany({
                    data: Array.from(targetStudentIds).map(studentId => ({
                        assignmentId: id,
                        studentId: studentId,
                        status: 'NEW',
                    })),
                    skipDuplicates: true,
                });
            }

            // Update assignment status and connect groups/students
            // We use connect, which adds to existing relations.
            const updateData: any = {
                status: 'PUBLISHED'
            };

            if (groupIds && groupIds.length > 0) {
                updateData.groups = {
                    connect: groupIds.map(gId => ({ id: gId })),
                };
            }
            if (studentIds && studentIds.length > 0) {
                updateData.assignedStudents = {
                    connect: studentIds.map(sId => ({ id: sId })),
                };
            }

            return await tx.assignment.update({
                where: { id },
                data: updateData,
                include: {
                    groups: { select: { id: true, name: true } },
                    assignedStudents: { select: { id: true, firstName: true, lastName: true } },
                    _count: {
                        select: { studentAssignments: true },
                    },
                },
            });
        });
    }

    async deleteAssignment(id: string, userId: string, role: string) {
        const existing = await prisma.assignment.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Assignment not found');
        }

        if (role === 'ADMIN' && existing.createdById !== userId) {
            throw new Error('Not authorized');
        }

        return await prisma.assignment.delete({ where: { id } });
    }

    async getLibraryAssignments(
        type?: string,
        search?: string,
        pagination?: { page: number; limit: number }
    ) {
        const where: any = {
            isPublic: true,
        };

        if (type && type !== 'ALL') {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const include = {
            createdBy: {
                select: { id: true, firstName: true, lastName: true },
            },
            _count: {
                select: { studentAssignments: true }
            }
        };

        if (pagination) {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                prisma.assignment.findMany({
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.assignment.count({ where }),
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

        return await prisma.assignment.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const assignmentService = new AssignmentService();
