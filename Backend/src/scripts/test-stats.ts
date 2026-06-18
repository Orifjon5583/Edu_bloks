
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

async function testStats() {
    console.log('Starting stats test...');
    try {
        console.log('Fetching counts...');
        const [totalBranches, totalGroups, totalTeachers, totalStudents, totalAssignments] = await Promise.all([
            prisma.branch.count(),
            prisma.group.count(),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.assignment.count({ where: { status: 'PUBLISHED' } }),
        ]);
        console.log('Counts fetched successfully:', { totalBranches, totalGroups, totalTeachers, totalStudents, totalAssignments });

        console.log('Fetching recent activity...');
        const [recentUsers, recentGroups, recentAssignmentsCreated] = await Promise.all([
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, firstName: true, lastName: true, role: true, createdAt: true }
            }),
            prisma.group.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, createdAt: true }
            }),
            prisma.assignment.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, type: true, createdAt: true }
            })
        ]);
        console.log('Recent activity fetched.');

        const _activities = [
            ...recentUsers.map(u => ({
                id: `user-${u.id}`,
                action: 'New User',
                details: `${u.firstName} ${u.lastName} (${u.role})`,
                createdAt: u.createdAt
            })),
            ...recentGroups.map(g => ({
                id: `group-${g.id}`,
                action: 'Group Created',
                details: g.name,
                createdAt: g.createdAt
            })),
            ...recentAssignmentsCreated.map(a => ({
                id: `assignment-${a.id}`,
                action: 'Assignment Created',
                details: `${a.title} (${a.type})`,
                createdAt: a.createdAt
            }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);
        console.log('Activities processed.');

        console.log('Fetching student assignments for stats...');
        const studentAssignments = await prisma.studentAssignment.findMany({
            include: {
                assignment: {
                    select: { type: true }
                }
            }
        });
        console.log(`Fetched ${studentAssignments.length} student assignments.`);

        // Stats by type
        const statsByType: any = {
            QUIZ: { total: 0, completed: 0 },
            SCRATCH_BLOCKS: { total: 0, completed: 0 },
            PYTHON_BLOCKS: { total: 0, completed: 0 }
        };

        studentAssignments.forEach(sa => {
            if (!sa.assignment) {
                console.warn('Found orphan student assignment:', sa.id);
                return;
            }

            const type = sa.assignment.type;
            if (statsByType[type]) {
                statsByType[type].total++;
                if (sa.status === 'PASSED' || sa.status === 'SUBMITTED') {
                    statsByType[type].completed++;
                }
            } else {
                console.warn(`Unknown assignment type encountered: ${type}`);
            }
        });
        console.log('Stats by type calculated.');

        // Teacher performance
        console.log('Fetching teachers...');
        const teachers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, firstName: true, lastName: true }
        });
        console.log(`Fetched ${teachers.length} teachers.`);

        const _teacherPerformance = await Promise.all(teachers.map(async (teacher) => {
            const assignments = await prisma.studentAssignment.findMany({
                where: {
                    assignment: { createdById: teacher.id }
                },
                select: { status: true }
            });
            return { id: teacher.id, count: assignments.length };
        }));
        console.log('Teacher performance calculated.');

        console.log('ALL CHECKS PASSED');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStats();
