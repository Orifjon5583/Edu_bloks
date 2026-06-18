import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createGroupSchema, updateGroupSchema, groupIdSchema } from '../validators/group.validator';
import { groupService } from '../services/group.service';

const router = Router();

// Get all groups (with optional pagination)
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { role, userId } = req.user!;

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

        const result = await groupService.getGroups(userId, role, pagination);
        return res.json(result);
    } catch (error) {
        console.error('Get groups error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Create group
router.post('/', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateBody(createGroupSchema), async (req: AuthRequest, res) => {
    try {
        const { name, teacherId, branchId } = req.body;
        const { role, userId } = req.user!;

        // Admin can only create groups for themselves (Service handles validation, but we can set default teacherId)
        // Wait, current logic: Admin MUST provide teacherId in body, but logic overrode it?
        // Original logic: `const finalTeacherId = role === 'ADMIN' ? userId : teacherId;`
        // We should replicate this or let service handle purely based on arguments?
        // Let's pass the correct teacherId based on Role HERE, before service.

        const finalTeacherId = role === 'ADMIN' ? userId : teacherId;

        if (!finalTeacherId) {
            return res.status(400).json({ error: 'Teacher ID is required' });
            // Although validation middleware should catch missing teacherId if schema requires it.
            // Schema requires teacherId? let's assume it does.
        }

        const group = await groupService.createGroup(name, finalTeacherId, branchId);
        return res.status(201).json(group);
    } catch (error: any) {
        if (error.message === 'Teacher not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Consistency Error')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Create group error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update group
router.put('/:id', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateParams(groupIdSchema), validateBody(updateGroupSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        const group = await groupService.updateGroup(id as string, req.body, userId, role);
        return res.json(group);
    } catch (error: any) {
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: 'Group not found' });
        }
        if (error.message === 'Not authorized to update this group') {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('Consistency Error')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Update group error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete group
router.delete('/:id', authenticate, requireRole('SUPERADMIN', 'ADMIN'), validateParams(groupIdSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        await groupService.deleteGroup(id as string, userId, role);
        return res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: 'Group not found' });
        }
        if (error.message === 'Not authorized to delete this group') {
            return res.status(403).json({ error: error.message });
        }
        console.error('Delete group error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
