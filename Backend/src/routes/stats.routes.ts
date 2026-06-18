import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';


const router = Router();
import { statsService } from '../services/stats.service';

// Get student progress
router.get('/student/progress', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
    try {
        const { userId } = req.user!;
        const progress = await statsService.getStudentProgress(userId);
        return res.json(progress);
    } catch (error) {
        console.error('Get student progress error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get teacher analytics
router.get('/teacher/analytics', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res) => {
    try {
        const { userId } = req.user!;
        const analytics = await statsService.getGroupAnalytics(userId);
        return res.json(analytics);
    } catch (error) {
        console.error('Get teacher analytics error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard stats for SuperAdmin
router.get('/stats', authenticate, requireRole('SUPERADMIN'), async (_req, res) => {
    try {
        const [totalBranches, totalGroups, totalTeachers, totalStudents, totalAssignments] = await Promise.all([
            prisma.branch.count(),
            prisma.group.count(),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.assignment.count({ where: { status: 'PUBLISHED' } }),
        ]);

        // --- Recent Activity ---
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

        const activities = [
            ...recentUsers.map(u => ({
                id: `user-${u.id}`,
                action: 'Новый пользователь',
                details: `${u.firstName} ${u.lastName} (${u.role})`,
                createdAt: u.createdAt
            })),
            ...recentGroups.map(g => ({
                id: `group-${g.id}`,
                action: 'Группа создана',
                details: g.name,
                createdAt: g.createdAt
            })),
            ...recentAssignmentsCreated.map(a => ({
                id: `assignment-${a.id}`,
                action: 'Задание создано',
                details: `${a.title} (${a.type})`,
                createdAt: a.createdAt
            }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        // --- Stats by Type ---
        const studentAssignments = await prisma.studentAssignment.findMany({
            include: {
                assignment: {
                    select: { type: true }
                }
            }
        });

        // Calculate global completion rate
        const completedCount = studentAssignments.filter(
            sa => sa.status === 'PASSED' || sa.status === 'SUBMITTED'
        ).length;

        const completionRate = studentAssignments.length > 0
            ? Math.round((completedCount / studentAssignments.length) * 100)
            : 0;

        // Calculate per-type stats
        const statsByType = {
            QUIZ: { total: 0, completed: 0 },
            SCRATCH_BLOCKS: { total: 0, completed: 0 },
            PYTHON_BLOCKS: { total: 0, completed: 0 }
        };

        studentAssignments.forEach(sa => {
            if (!sa.assignment) return; // metrics safety

            const type = sa.assignment.type as keyof typeof statsByType;
            if (statsByType[type]) {
                statsByType[type].total++;
                if (sa.status === 'PASSED' || sa.status === 'SUBMITTED') {
                    statsByType[type].completed++;
                }
            } else {
                console.warn(`Unknown assignment type encountered: ${type}`);
            }
        });

        // Safe percent calculation
        const safePercent = (completed: number, total: number) =>
            total > 0 ? Math.round((completed / total) * 100) : 0;

        const statsByTypePercent = {
            quiz: safePercent(statsByType.QUIZ.completed, statsByType.QUIZ.total),
            scratch: safePercent(statsByType.SCRATCH_BLOCKS.completed, statsByType.SCRATCH_BLOCKS.total),
            python: safePercent(statsByType.PYTHON_BLOCKS.completed, statsByType.PYTHON_BLOCKS.total),
        };

        // --- Teacher Performance ---
        const teachers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, firstName: true, lastName: true }
        });

        const teacherPerformance = await Promise.all(teachers.map(async (teacher) => {
            const assignments = await prisma.studentAssignment.findMany({
                where: {
                    assignment: { createdById: teacher.id }
                },
                select: { status: true }
            });

            const total = assignments.length;
            const completed = assignments.filter(a => ['PASSED', 'SUBMITTED'].includes(a.status)).length;

            const goodPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const badPercent = total > 0 ? 100 - goodPercent : 0;

            return {
                id: teacher.id,
                name: `${teacher.firstName} ${teacher.lastName}`,
                goodPercent,
                badPercent,
                totalAssignments: total
            };
        }));

        return res.json({
            totalBranches,
            totalGroups,
            totalTeachers,
            totalStudents,
            activeAssignments: totalAssignments,
            completionRate,
            recentActivity: activities,
            statsByType: statsByTypePercent,
            teacherPerformance // [NEW]
        });
    } catch (error: any) {
        console.error('Get superadmin stats error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get dashboard stats for Admin/Teacher
router.get('/admin/stats', authenticate, requireRole('ADMIN'), async (req, res) => {
    try {
        const authReq = req as unknown as AuthRequest;
        const { userId } = authReq.user!;

        const [myGroups, myAssignments] = await Promise.all([
            prisma.group.findMany({
                where: { teacherId: userId },
                include: {
                    _count: {
                        select: { students: true },
                    },
                },
            }),
            prisma.assignment.findMany({
                where: { createdById: userId },
                include: {
                    _count: {
                        select: { studentAssignments: true },
                    },
                },
            }),
        ]);

        const totalStudents = myGroups.reduce((sum, g) => sum + g._count.students, 0);
        const activeAssignments = myAssignments.filter(a => a.status === 'PUBLISHED').length;

        // Calculate completion rate for this teacher's assignments
        const studentAssignments = await prisma.studentAssignment.findMany({
            where: {
                assignment: {
                    createdById: userId,
                },
            },
            select: { status: true },
        });

        const completedCount = studentAssignments.filter(
            sa => sa.status === 'PASSED' || sa.status === 'SUBMITTED'
        ).length;

        const completionRate = studentAssignments.length > 0
            ? Math.round((completedCount / studentAssignments.length) * 100)
            : 0;

        // --- Student Performance ---
        const myStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                group: { teacherId: userId }
            },
            select: { id: true, firstName: true, lastName: true, group: { select: { name: true } } }
        });

        const studentPerformance = await Promise.all(myStudents.map(async (student) => {
            const assignments = await prisma.studentAssignment.findMany({
                where: {
                    studentId: student.id,
                    assignment: { createdById: userId }
                },
                select: { status: true }
            });

            const total = assignments.length;
            const completed = assignments.filter(a => ['PASSED', 'SUBMITTED'].includes(a.status)).length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                groupName: student.group?.name || 'Без группы',
                completionRate
            };
        }));

        res.json({
            totalGroups: myGroups.length,
            totalStudents,
            activeAssignments,
            completionRate,
            studentPerformance // [NEW]
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
