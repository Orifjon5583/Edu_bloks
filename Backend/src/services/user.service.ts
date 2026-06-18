import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export class UserService {
    /**
     * Check if ADMIN owns the student (student is in one of ADMIN's groups)
     */
    private async verifyAdminOwnsStudent(adminId: string, studentId: string): Promise<boolean> {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: { group: { select: { teacherId: true } } },
        });

        if (!student || student.role !== 'STUDENT') {
            return false;
        }

        // Student must be in a group taught by this ADMIN
        if (!student.group) {
            // Students without a group can be managed by any ADMIN of their branch
            const admin = await prisma.user.findUnique({ where: { id: adminId } });
            return admin?.branchId === student.branchId;
        }

        return student.group.teacherId === adminId;
    }

    /**
     * Check if user (teacher) can change their branch
     */
    private async canTeacherChangeBranch(userId: string): Promise<boolean> {
        const groups = await prisma.group.count({
            where: { teacherId: userId },
        });
        return groups === 0;
    }

    /**
     * Check if teacher can be deleted (no active groups)
     */
    private async canDeleteTeacher(userId: string): Promise<boolean> {
        const groups = await prisma.group.count({
            where: { teacherId: userId },
        });
        return groups === 0;
    }

    /**
     * Create a new user with permission checks
     */
    /**
     * Sync published assignments when a student joins a group
     */
    private async syncGroupAssignments(userId: string, groupId: string) {
        // Find all PUBLISHED assignments for this group
        const assignments = await prisma.assignment.findMany({
            where: {
                status: 'PUBLISHED',
                groups: {
                    some: { id: groupId },
                },
            },
            select: { id: true },
        });

        if (assignments.length > 0) {
            // Create student assignments for existing published assignments
            await prisma.studentAssignment.createMany({
                data: assignments.map(a => ({
                    studentId: userId,
                    assignmentId: a.id,
                    status: 'NEW',
                })),
                skipDuplicates: true,
            });
        }
    }

    /**
     * Create a new user with permission checks
     */
    async createUser(data: any, actorId: string, actorRole: string) {
        const { login, password, firstName, lastName, role, groupId, branchId } = data;

        const normalizedRole = (role as string).toUpperCase();

        // Security check: ADMIN can only create STUDENTs
        if (actorRole === 'ADMIN' && normalizedRole !== 'STUDENT') {
            throw new Error('Admins can only create Students');
        }

        // ADMIN can only create students in their own branch or groups
        if (actorRole === 'ADMIN') {
            const admin = await prisma.user.findUnique({ where: { id: actorId } });
            if (!admin) {
                throw new Error('Admin not found');
            }

            // If groupId is provided, verify ADMIN owns this group
            if (groupId) {
                const group = await prisma.group.findUnique({ where: { id: groupId } });
                if (!group || group.teacherId !== actorId) {
                    throw new Error('Cannot create student in group you do not own');
                }
            }

            // If branchId is provided, verify it matches ADMIN's branch
            if (branchId && branchId !== admin.branchId) {
                throw new Error('Cannot create student in different branch');
            }
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPassword = password;

        try {
            const user = await prisma.user.create({
                data: {
                    login,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: normalizedRole as any,
                    groupId: groupId || null,
                    branchId: branchId || null,
                },
                select: {
                    id: true,
                    login: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    groupId: true,
                    branchId: true,
                    password: true,
                    createdAt: true,
                },
            });

            // CRM Logic: If student is added to a group, sync assignments
            if (normalizedRole === 'STUDENT' && groupId) {
                await this.syncGroupAssignments(user.id, groupId);
            }

            return user;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('User with this login already exists');
            }
            throw error;
        }
    }

    /**
     * Update user with permission checks
     */
    async updateUser(id: string, data: any, actorId: string, actorRole: string) {
        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: { teacherGroups: true },
        });

        if (!targetUser) {
            throw new Error('User not found');
        }

        // Security checks for ADMIN
        if (actorRole === 'ADMIN') {
            if (targetUser.role !== 'STUDENT') {
                throw new Error('Admins can only update Students');
            }

            // Verify ADMIN owns this student
            const hasOwnership = await this.verifyAdminOwnsStudent(actorId, id);
            if (!hasOwnership) {
                throw new Error('Not authorized to update this student');
            }

            if (data.role && data.role.toUpperCase() !== 'STUDENT') {
                throw new Error('Admins cannot promote users');
            }

            // If changing group, verify ADMIN owns the target group
            if (data.groupId && data.groupId !== targetUser.groupId) {
                const targetGroup = await prisma.group.findUnique({ where: { id: data.groupId } });
                if (!targetGroup || targetGroup.teacherId !== actorId) {
                    throw new Error('Cannot move student to group you do not own');
                }
            }
        }

        // Teacher-branch validation: prevent branch change if teacher has groups
        if (targetUser.role === 'ADMIN' && data.branchId !== undefined && data.branchId !== targetUser.branchId) {
            const canChange = await this.canTeacherChangeBranch(id);
            if (!canChange) {
                throw new Error('Cannot change branch for teacher with active groups. Reassign groups first.');
            }
        }

        const updateData: any = {};
        if (data.login) updateData.login = data.login;
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.role) updateData.role = data.role.toUpperCase();
        if (data.groupId !== undefined) updateData.groupId = data.groupId;
        if (data.branchId !== undefined) updateData.branchId = data.branchId;
        if (data.password) updateData.password = data.password; // Removed bcrypt.hash

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                login: true,
                firstName: true,
                lastName: true,
                role: true,
                groupId: true,
                branchId: true,
                password: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // CRM Logic: If student moved to a new group, sync assignments
        if (targetUser.role === 'STUDENT' && data.groupId && data.groupId !== targetUser.groupId) {
            await this.syncGroupAssignments(id, data.groupId);
        }

        return updatedUser;
    }

    /**
     * Delete user with permission checks
     */
    async deleteUser(id: string, actorId: string, actorRole: string) {
        const targetUser = await prisma.user.findUnique({ where: { id } });

        if (!targetUser) {
            throw new Error('User not found');
        }

        if (actorRole === 'ADMIN') {
            if (targetUser.role !== 'STUDENT') {
                throw new Error('Admins can only delete Students');
            }

            // Verify ADMIN owns this student
            const hasOwnership = await this.verifyAdminOwnsStudent(actorId, id);
            if (!hasOwnership) {
                throw new Error('Not authorized to delete this student');
            }
        }

        // Prevent deletion of teachers with active groups
        if (targetUser.role === 'ADMIN') {
            const canDelete = await this.canDeleteTeacher(id);
            if (!canDelete) {
                throw new Error('Cannot delete teacher with active groups. Reassign or delete groups first.');
            }
        }

        return await prisma.user.delete({ where: { id } });
    }

    /**
     * Reset password
     */
    async resetPassword(id: string, password: string, actorId: string, actorRole: string) {
        const targetUser = await prisma.user.findUnique({ where: { id } });

        if (!targetUser) {
            throw new Error('User not found');
        }

        if (actorRole === 'ADMIN') {
            if (targetUser.role !== 'STUDENT') {
                throw new Error('Admins can only reset passwords for Students');
            }

            // Verify ADMIN owns this student
            const hasOwnership = await this.verifyAdminOwnsStudent(actorId, id);
            if (!hasOwnership) {
                throw new Error('Not authorized to reset password for this student');
            }
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPassword = password;

        return await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    /**
     * Get all users with filters and optional pagination
     */
    async getUsers(
        roleFilter?: string,
        actorId?: string,
        actorRole?: string,
        pagination?: { page: number; limit: number }
    ) {
        let where: any = {};

        if (roleFilter) {
            const normalizedRole = roleFilter.toUpperCase();
            if (Object.values(UserRole).includes(normalizedRole as UserRole)) {
                where.role = normalizedRole;
            }
        }

        // ADMIN should only see users from their branch AND specifically their groups (or unassigned)
        if (actorRole === 'ADMIN' && actorId) {
            const admin = await prisma.user.findUnique({ where: { id: actorId } });

            const orConditions: any[] = [
                { group: { teacherId: actorId } } // Students in groups taught by this admin
            ];

            if (admin?.branchId) {
                orConditions.push({
                    branchId: admin.branchId,
                    groupId: null
                }); // Students in the same branch but not assigned to any group
            }

            where.OR = orConditions;
        }

        const select = {
            id: true,
            login: true,
            firstName: true,
            lastName: true,
            role: true,
            groupId: true,
            branchId: true,
            group: {
                select: {
                    id: true,
                    name: true,
                    teacher: {
                        select: { firstName: true, lastName: true }
                    }
                }
            },
            branch: { select: { id: true, name: true } },
            password: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { teacherGroups: true, studentAssignments: true } },
            // Include student assignment stats for progress calculation
            studentAssignments: {
                select: {
                    status: true,
                },
            },
        };

        // If pagination is provided, return paginated result
        if (pagination) {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.user.count({ where }),
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
        return await prisma.user.findMany({
            where,
            select,
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const userService = new UserService();
