import { prisma } from '../lib/prisma';

export class BranchService {
    /**
     * Get all branches with counts
     */
    async getAllBranches() {
        return await prisma.branch.findMany({
            include: {
                _count: {
                    select: {
                        groups: true,
                        users: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create a new branch
     */
    async createBranch(name: string) {
        try {
            return await prisma.branch.create({
                data: { name },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('Branch with this name already exists');
            }
            throw error;
        }
    }

    /**
     * Update a branch
     */
    async updateBranch(id: string, name: string) {
        try {
            return await prisma.branch.update({
                where: { id },
                data: { name },
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new Error('Branch not found');
            }
            if (error.code === 'P2002') {
                throw new Error('Branch with this name already exists');
            }
            throw error;
        }
    }

    /**
     * Delete a branch with dependency checks
     */
    async deleteBranch(id: string) {
        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        groups: true,
                        users: true,
                    },
                },
            },
        });

        if (!branch) {
            throw new Error('Branch not found');
        }

        // CRM Logic: Prevent limiting if there are active entities
        if (branch._count.groups > 0) {
            throw new Error('Cannot delete branch with active groups. Move or delete groups first.');
        }
        if (branch._count.users > 0) {
            throw new Error('Cannot delete branch with active users. Move or delete users first.');
        }

        return await prisma.branch.delete({
            where: { id },
        });
    }
}

export const branchService = new BranchService();
