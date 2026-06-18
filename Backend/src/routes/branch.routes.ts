import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createBranchSchema, updateBranchSchema, branchIdSchema } from '../validators/branch.validator';
import { branchService } from '../services/branch.service';


const router = Router();

// Get all branches (SuperAdmin only)
router.get('/', authenticate, requireRole('SUPERADMIN'), async (_req, res) => {
    try {
        const branches = await branchService.getAllBranches();
        return res.json(branches);
    } catch (error) {
        console.error('Get branches error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Create branch
router.post('/', authenticate, requireRole('SUPERADMIN'), validateBody(createBranchSchema), async (req, res) => {
    try {
        const { name } = req.body;
        const branch = await branchService.createBranch(name);
        return res.status(201).json(branch);
    } catch (error: any) {
        if (error.message === 'Branch with this name already exists') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Create branch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update branch
router.put('/:id', authenticate, requireRole('SUPERADMIN'), validateParams(branchIdSchema), validateBody(updateBranchSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const branch = await branchService.updateBranch(id as string, name);
        return res.json(branch);
    } catch (error: any) {
        if (error.message === 'Branch not found') {
            return res.status(404).json({ error: 'Branch not found' });
        }
        if (error.message === 'Branch with this name already exists') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Update branch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete branch
router.delete('/:id', authenticate, requireRole('SUPERADMIN'), validateParams(branchIdSchema), async (req, res) => {
    try {
        const { id } = req.params;
        await branchService.deleteBranch(id as string);
        return res.json({ message: 'Branch deleted successfully' });
    } catch (error: any) {
        if (error.message === 'Branch not found') {
            return res.status(404).json({ error: 'Branch not found' });
        }
        if (error.message.startsWith('Cannot delete branch')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Delete branch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
