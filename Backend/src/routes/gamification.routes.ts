import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { gamificationService } from '../services/gamification.service';

const router = Router();

// Get leaderboard
router.get('/leaderboard', authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, role } = req.user!;

        // Fetch user to get groupId (since not in token)
        const user = await import('../lib/prisma').then(m => m.prisma.user.findUnique({
            where: { id: userId },
            select: { groupId: true }
        }));

        const groupId = user?.groupId;

        const scope = req.query.scope as string; // 'GROUP' or 'GLOBAL'

        let targetGroupId: string | undefined = undefined;

        // Logic for scoping
        // If provided in query (e.g. teacher selection), use that
        if (req.query.groupId) {
            targetGroupId = req.query.groupId as string;
        }
        // If scope is GROUP (default for student if not specified?)
        // Let's say default is GROUP for students.
        else if (role === 'STUDENT' && (!scope || scope === 'GROUP')) {
            if (groupId) targetGroupId = groupId;
        }

        const leaderboard = await gamificationService.getLeaderboard(targetGroupId);
        return res.json(leaderboard);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
