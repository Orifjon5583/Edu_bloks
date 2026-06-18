import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Starting cleanup...');

    try {
        // Delete all groups (this will cascade to StudentAssignment if configured, or we delete recursively)
        // Schema says: Group -> Student (onDelete: SetNull or Cascade?)
        // Let's check schema. User.groupId is optional.

        // 1. Delete all StudentAssignments and Submissions
        console.log('Deleting submissions...');
        await prisma.submission.deleteMany({});

        console.log('Deleting student assignments...');
        await prisma.studentAssignment.deleteMany({});

        // 2. Delete all Assignments created by non-superadmins (Teachers)
        // Teachers are ADMIN role.
        // If we delete teachers, assignments might persist if onDelete is not Cascade?
        // Schema: Assignment.createdBy -> User (onDelete: Cascade). So deleting user deletes assignment.

        // 3. Delete all Groups
        console.log('Deleting groups...');
        await prisma.group.deleteMany({});

        // 4. Delete all Branches (except maybe a default one? User said "all except superadmin")
        console.log('Deleting branches...');
        await prisma.branch.deleteMany({});

        // 5. Delete all Users except SuperAdmin
        console.log('Deleting users (except SuperAdmin)...');
        const count = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'SUPERADMIN'
                }
            }
        });

        console.log(`✅ Deleted ${count.count} users.`);
        console.log('🎉 Reset complete! Only SuperAdmin remains.');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
