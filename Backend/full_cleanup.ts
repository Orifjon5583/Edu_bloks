import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('🧹 Starting full database cleanup...');

    try {
        // 1. Delete Student Assignments & Submissions (should be gone via cascade, but being safe)
        await prisma.submission.deleteMany();
        await prisma.studentAssignment.deleteMany();
        console.log('✅ Cleared Submissions & StudentAssignments');

        // 2. Delete Assignments
        await prisma.assignment.deleteMany();
        console.log('✅ Cleared Assignments');

        // 3. Delete Groups
        await prisma.group.deleteMany();
        console.log('✅ Cleared Groups');

        // 4. Delete Branches
        await prisma.branch.deleteMany();
        console.log('✅ Cleared Branches');

        // 5. Delete Users (except SuperAdmin)
        const deleteUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'SUPERADMIN'
                }
            }
        });
        console.log(`✅ Cleared ${deleteUsers.count} Users (kept SuperAdmin)`);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
