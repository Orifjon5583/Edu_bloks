import { prisma } from '../lib/prisma';

export const LEVELS = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 300 },
    { level: 4, xp: 600 },
    { level: 5, xp: 1000 },
    { level: 6, xp: 1500 },
    { level: 7, xp: 2100 },
    { level: 8, xp: 2800 },
    { level: 9, xp: 3600 },
    { level: 10, xp: 4500 },
];

export class GamificationService {
    async awardXP(userId: string, amount: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        const newXP = user.xp + amount;
        let newLevel = user.level;

        // Check for level up
        // Find highest level where required xp <= newXP
        const levelObj = [...LEVELS].reverse().find(l => newXP >= l.xp);
        if (levelObj && levelObj.level > user.level) {
            newLevel = levelObj.level;
        }

        await prisma.user.update({
            where: { id: userId },
            data: { xp: newXP, level: newLevel }
        });

        return { newXP, newLevel, leveledUp: newLevel > user.level };
    }

    async checkAndAwardBadges(userId: string, _output: any) {
        // Simple example: First submission badge
        const submissionsCount = await prisma.submission.count({ where: { studentId: userId } });

        if (submissionsCount === 1) {
            await this.awardBadgeByCondition(userId, 'FIRST_WIN');
        }

        // Add more logic here (e.g. check consecutive days, perfect scores)
    }

    async awardBadgeByCondition(userId: string, condition: string) {
        const badge = await prisma.badge.findFirst({ where: { condition } });
        if (!badge) return; // Badge not defined in DB

        // Check if already has it
        const hasBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: { userId, badgeId: badge.id }
            }
        });

        if (!hasBadge) {
            await prisma.userBadge.create({
                data: { userId, badgeId: badge.id }
            });
            // Give XP for badge
            if (badge.xpReward > 0) {
                await this.awardXP(userId, badge.xpReward);
            }
        }
    }

    async getLeaderboard(groupId?: string) {
        const where = groupId ? { groupId, role: 'STUDENT' as const } : { role: 'STUDENT' as const };

        return await prisma.user.findMany({
            where,
            orderBy: { xp: 'desc' },
            take: 10,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                xp: true,
                level: true,
                // Include badges count perhaps?
                _count: {
                    select: { badges: true }
                }
            }
        });
    }
}

export const gamificationService = new GamificationService();
