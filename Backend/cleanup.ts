import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('🧹 Starting database cleanup...');

    try {
        // Count users before cleanup
        const userCount = await prisma.user.count();
        console.log(`📊 Total users before cleanup: ${userCount}`);

        // Delete all users except SUPERADMIN
        // Due to cascade rules in schema.prisma:
        // - Deleting a Teacher (ADMIN) will cascade delete their Groups and created Assignments
        // - Deleting a Student (STUDENT) will cascade delete their StudentAssignments and Submissions
        const deleteResult = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'SUPERADMIN'
                }
            }
        });

        console.log(`✅ Deleted ${deleteResult.count} users (Students & Teachers).`);

        // Verify remaining users
        const remainingUsers = await prisma.user.findMany();
        console.log('👥 Remaining users:', remainingUsers.map(u => `${u.login} (${u.role})`));

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
