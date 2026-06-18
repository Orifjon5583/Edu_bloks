import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createAssignmentSchema, updateAssignmentSchema, publishAssignmentSchema, assignmentIdSchema } from '../validators/assignment.validator';
import { assignmentService } from '../services/assignment.service';

const router = Router();

// Get assignments (Admin sees their own, SuperAdmin sees all) with optional pagination
router.get('/', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res) => {
    try {
        const { role, userId } = req.user!;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;

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

        const result = await assignmentService.getAssignments(userId, role, status, pagination);
        return res.json(result);
    } catch (error) {
        console.error('Get assignments error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get public library assignments (available to all authenticated users)
router.get('/library', authenticate, async (req: AuthRequest, res) => {
    try {
        const type = typeof req.query.type === 'string' ? req.query.type : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;

        // Parse pagination params
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

        const result = await assignmentService.getLibraryAssignments(type, search, pagination);
        return res.json(result);
    } catch (error) {
        console.error('Get library assignments error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single assignment
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        const assignment = await assignmentService.getAssignmentById(id as string, userId, role);
        return res.json(assignment);
    } catch (error: any) {
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        if (error.message === 'Not authorized') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        console.error('Get assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get assignment results (Teacher)
router.get('/:id/results', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        const results = await assignmentService.getAssignmentResults(id as string, userId, role);
        return res.json(results);
    } catch (error: any) {
        if (error.message === 'Not authorized') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        console.error('Get assignment results error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Create assignment
router.post('/', authenticate, requireRole('ADMIN', 'SUPERADMIN'), validateBody(createAssignmentSchema), async (req: AuthRequest, res) => {
    try {
        const { userId } = req.user!;
        const assignment = await assignmentService.createAssignment(req.body, userId);
        return res.status(201).json(assignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update assignment
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPERADMIN'), validateParams(assignmentIdSchema), validateBody(updateAssignmentSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        const assignment = await assignmentService.updateAssignment(id as string, req.body, userId, role);
        return res.json(assignment);
    } catch (error: any) {
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        if (error.message === 'Not authorized') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        console.error('Update assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Publish assignment
router.post('/:id/publish', authenticate, requireRole('ADMIN', 'SUPERADMIN'), validateParams(assignmentIdSchema), validateBody(publishAssignmentSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { groupIds, studentIds } = req.body;
        const { role, userId } = req.user!;

        // Validation happened in middleware, but double check we have correct types if optional

        const updatedAssignment = await assignmentService.publishAssignment(id as string, groupIds, studentIds, userId, role);
        return res.json(updatedAssignment);
        return res.json(updatedAssignment);
    } catch (error: any) {
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        if (error.message === 'Not authorized') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        console.error('Publish assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete assignment
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPERADMIN'), validateParams(assignmentIdSchema), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, userId } = req.user!;

        await assignmentService.deleteAssignment(id as string, userId, role);
        return res.json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        if (error.message === 'Not authorized') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        console.error('Delete assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
