import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validators/user.validator';
import { userService } from '../services/user.service';


const router = Router();

// Get all users (with role filter and optional pagination)
router.get('/', authenticate, requireRole('SUPERADMIN', 'ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { userId, role: actorRole } = req.user!;
        const roleParam = req.query.role;
        const role = typeof roleParam === 'string' ? roleParam : undefined;

        // Parse pagination params if provided
        const pageParam = req.query.page;
        const limitParam = req.query.limit;

        let pagination: { page: number; limit: number } | undefined;
        if (pageParam || limitParam) {
            const page = parseInt(String(pageParam || '1'), 10);
            const limit = Math.min(parseInt(String(limitParam || '20'), 10), 100);
            pagination = {
                page: Math.max(1, page),
                limit: Math.max(1, limit)
            };
        }

        const result = await userService.getUsers(role, userId, actorRole, pagination);
        return res.json(result);
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user
router.post('/', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateBody(createUserSchema), async (req: AuthRequest, res) => {
    try {
        const { userId, role: actorRole } = req.user!;
        const user = await userService.createUser(req.body, userId, actorRole);

        // Note: Password is NOT returned in API response for security.
        return res.status(201).json(user);
    } catch (error: any) {
        if (error.message === 'Admins can only create Students' ||
            error.message.includes('Cannot create student')) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message === 'User with this login already exists') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user
router.put('/:id', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateParams(userIdSchema), validateBody(updateUserSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { userId, role: actorRole } = req.user!;

        const user = await userService.updateUser(id as string, req.body, userId, actorRole);
        return res.json(user);
    } catch (error: any) {
        if (error.code === 'P2025' || error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message.startsWith('Admins can only') ||
            error.message.startsWith('Not authorized') ||
            error.message.startsWith('Cannot move') ||
            error.message.startsWith('Cannot change branch')) {
            return res.status(403).json({ error: error.message });
        }
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user
router.delete('/:id', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateParams(userIdSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { userId, role: actorRole } = req.user!;

        await userService.deleteUser(id as string, userId, actorRole);
        return res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025' || error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message.startsWith('Admins can only') ||
            error.message.startsWith('Not authorized') ||
            error.message.startsWith('Cannot delete teacher')) {
            return res.status(403).json({ error: error.message });
        }
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset password (SuperAdmin only, or Admin for Students)
router.post('/:id/reset-password', authenticate, requireRole('SUPERADMIN', 'ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const { userId, role: actorRole } = req.user!;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        await userService.resetPassword(id as string, password, userId, actorRole);
        return res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.startsWith('Admins can only') ||
            error.message.startsWith('Not authorized')) {
            return res.status(403).json({ error: error.message });
        }
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
