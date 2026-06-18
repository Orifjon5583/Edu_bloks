import { prisma } from '../lib/prisma';
import { gamificationService } from './gamification.service';

export class StudentService {
    async getStudentAssignments(userId: string) {
        const studentAssignments = await prisma.studentAssignment.findMany({
            where: { studentId: userId },
            include: {
                assignment: {
                    include: {
                        createdBy: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
                submissions: {
                    orderBy: { submittedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Batch update OVERDUE assignments
        const now = new Date();
        const overdueIds = studentAssignments
            .filter(sa =>
                sa.status !== 'PASSED' &&
                sa.status !== 'FAILED' &&
                sa.assignment && // Safety check
                sa.assignment.dueAt < now
            )
            .map(sa => sa.id);

        if (overdueIds.length > 0) {
            await prisma.studentAssignment.updateMany({
                where: { id: { in: overdueIds } },
                data: { status: 'OVERDUE' },
            });

            studentAssignments.forEach(sa => {
                if (overdueIds.includes(sa.id)) {
                    sa.status = 'OVERDUE';
                }
            });
        }

        return studentAssignments;
    }

    async getAssignmentById(id: string, userId: string) {
        const studentAssignment = await prisma.studentAssignment.findFirst({
            where: {
                assignmentId: id,
                studentId: userId,
            },
            include: {
                assignment: {
                    include: {
                        createdBy: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
                submissions: {
                    orderBy: { submittedAt: 'desc' },
                },
            },
        });

        if (!studentAssignment) {
            throw new Error('Assignment not found');
        }

        return studentAssignment;
    }

    async submitAssignment(userId: string, assignmentId: string, answers: any) {
        const studentAssignment = await prisma.studentAssignment.findFirst({
            where: {
                assignmentId,
                studentId: userId,
            },
            include: { assignment: true },
        });

        if (!studentAssignment) {
            throw new Error('Assignment not found');
        }

        // Calculate score
        const { score, maxScore } = this.calculateScore(studentAssignment.assignment, answers);

        const now = new Date();
        const isLate = now > studentAssignment.assignment.dueAt;

        const submission = await prisma.submission.create({
            data: {
                studentAssignmentId: studentAssignment.id,
                assignmentId,
                studentId: userId,
                attemptNo: studentAssignment.attempts + 1,
                score,
                maxScore,
                isLate,
                answers,
            },
        });

        // Update student assignment
        const passThreshold = maxScore * 0.7; // 70% to pass
        const newBestScore = Math.max(studentAssignment.bestScore || 0, score);
        const newStatus = newBestScore >= passThreshold ? 'PASSED' : 'FAILED';

        await prisma.studentAssignment.update({
            where: { id: studentAssignment.id },
            data: {
                status: newStatus,
                bestScore: newBestScore,
                attempts: studentAssignment.attempts + 1,
                isLate: isLate || studentAssignment.isLate,
            },
        });

        // Award XP if passed and wasn't passed before (or improve score?)
        // Simple logic: Give XP first time they pass
        if (newStatus === 'PASSED' && studentAssignment.status !== 'PASSED') {
            // Reward: 100 XP + Score
            const reward = 100 + Math.floor(score / 10);
            await gamificationService.awardXP(userId, reward);
        }

        // Check badges
        await gamificationService.checkAndAwardBadges(userId, { submission, assignment: studentAssignment.assignment });

        return submission;


    }

    async getSubmissions(userId: string, assignmentId?: string) {
        const where: any = { studentId: userId };
        if (assignmentId) {
            where.assignmentId = assignmentId;
        }

        return await prisma.submission.findMany({
            where,
            include: {
                studentAssignment: {
                    include: {
                        assignment: {
                            select: { id: true, title: true, type: true },
                        },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }

    async giveFeedback(studentAssignmentId: string, feedback: string) {
        return await prisma.studentAssignment.update({
            where: { id: studentAssignmentId },
            data: { feedback }
        });
    }

    private calculateScore(assignment: any, answers: any): { score: number; maxScore: number } {
        if (assignment.type === 'QUIZ') {
            const questions = assignment.content.questions;
            const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);
            let earnedPoints = 0;

            answers.forEach((answer: any) => {
                const question = questions.find((q: any) => q.id === answer.questionId);
                if (question && answer.selectedIndex === question.correctIndex) {
                    earnedPoints += question.points;
                }
            });

            return { score: earnedPoints, maxScore: totalPoints };
        }

        if (assignment.type === 'SCRATCH_BLOCKS' || assignment.type === 'PYTHON_BLOCKS') {
            const maxScore = 100;

            // Multi-task support
            if (assignment.content.tasks && Array.isArray(assignment.content.tasks)) {
                const tasks = assignment.content.tasks;
                const userTasks = answers.tasks || [];
                let totalCorrectPercent = 0;

                tasks.forEach((task: any, index: number) => {
                    // Find user answer for this task (by ID or index)
                    // Assuming frontend sends { tasks: [{ id: '1', sequence: [...] }] }
                    const userTask = userTasks.find((t: any) => t.id === task.id) || userTasks[index];
                    const solution = task.solution || [];
                    const userSequence = userTask?.sequence || [];

                    if (JSON.stringify(solution) === JSON.stringify(userSequence)) {
                        totalCorrectPercent += 1;
                        return;
                    }

                    // Partial score for this task
                    let correctCount = 0;
                    const minLength = Math.min(solution.length, userSequence.length);
                    for (let i = 0; i < minLength; i++) {
                        if (solution[i] === userSequence[i]) {
                            correctCount++;
                        }
                    }
                    if (solution.length > 0) {
                        totalCorrectPercent += (correctCount / solution.length);
                    }
                });

                const finalScore = Math.floor((totalCorrectPercent / tasks.length) * maxScore);
                return { score: finalScore, maxScore };
            }

            // Legacy single-task support
            const solution = assignment.content.solution;
            const userSequence = answers.sequence;

            if (JSON.stringify(solution) === JSON.stringify(userSequence)) {
                return { score: maxScore, maxScore };
            }

            let correctCount = 0;
            const minLength = Math.min(solution.length, userSequence.length);
            for (let i = 0; i < minLength; i++) {
                if (solution && solution[i] === userSequence[i]) {
                    correctCount++;
                }
            }

            const partialScore = Math.floor((correctCount / solution.length) * maxScore);
            return { score: partialScore, maxScore };
        }

        return { score: 0, maxScore: 100 };
    }
}

export const studentService = new StudentService();
