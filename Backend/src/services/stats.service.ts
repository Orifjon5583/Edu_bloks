import { prisma } from '../lib/prisma';

export class StatsService {
    // For Students: Get XP history (last 7 days or assignments)
    async getStudentProgress(studentId: string) {
        // Get all completed assignments
        const submissions = await prisma.submission.findMany({
            where: { studentId },
            orderBy: { submittedAt: 'asc' },
            select: {
                score: true,
                maxScore: true,
                submittedAt: true,
                studentAssignment: {
                    select: {
                        assignment: { select: { title: true } }
                    }
                }
            }
        });

        // Group by assignment for a "Progress line"
        // Or if we track XP history separate table, we'd use that.
        // For now, let's just plot score % over time across assignments.

        return submissions.map(s => ({
            date: s.submittedAt.toISOString().split('T')[0],
            title: s.studentAssignment.assignment.title,
            score: s.score,
            percent: Math.round((s.score || 0) / s.maxScore * 100)
        }));
    }

    // For Teachers: Get Group Performance (Avg score per assignment)
    async getGroupAnalytics(teacherId: string) {
        // Get assignments created by teacher
        const assignments = await prisma.assignment.findMany({
            where: { createdById: teacherId, status: 'PUBLISHED' },
            include: {
                studentAssignments: {
                    select: { status: true, bestScore: true }
                }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        return assignments.map(a => {
            const total = a.studentAssignments.length;
            const avgScore = total > 0
                ? a.studentAssignments.reduce((acc, curr) => acc + (curr.bestScore || 0), 0) / total
                : 0;

            return {
                title: a.title,
                avgScore: Math.round(avgScore),
                submittedCount: a.studentAssignments.filter(s => s.status === 'PASSED' || s.status === 'SUBMITTED').length,
                totalStudents: total
            };
        }).reverse(); // Show oldest to newest? Or newest first? Charts usually left-to-right time. So reverse to put oldest on left.
    }
}

export const statsService = new StatsService();
