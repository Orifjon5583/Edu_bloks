import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { submitAssignmentSchema } from '../validators/student.validator';
import { studentService } from '../services/student.service';

const router = Router();

// Get student's assignments
router.get('/assignments', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
    try {
        const { userId } = req.user!;
        const studentAssignments = await studentService.getStudentAssignments(userId);
        return res.json(studentAssignments);
    } catch (error) {
        console.error('Get student assignments error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single assignment for student
router.get('/assignments/:id', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const studentAssignment = await studentService.getAssignmentById(id as string, userId);
        return res.json(studentAssignment);
    } catch (error: any) {
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        console.error('Get assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit assignment
router.post('/submissions', authenticate, requireRole('STUDENT'), validateBody(submitAssignmentSchema), async (req: AuthRequest, res) => {
    try {
        const { assignmentId, answers, cheatWarnings } = req.body;
        const { userId } = req.user!;

        const submission = await studentService.submitAssignment(userId, assignmentId, answers, cheatWarnings || 0);
        return res.status(201).json(submission);
    } catch (error: any) {
        if (error.message === 'Missing required fields') {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (error.message === 'Assignment not found') {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        console.error('Submit assignment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get submission history
router.get('/submissions', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
    try {
        const { userId } = req.user!;
        const assignmentId = typeof req.query.assignmentId === 'string' ? req.query.assignmentId : undefined;

        const submissions = await studentService.getSubmissions(userId, assignmentId);
        return res.json(submissions);
    } catch (error) {
        console.error('Get submissions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Give feedback (Teacher)
router.post('/assignments/:id/feedback', authenticate, requireRole('ADMIN', 'SUPERADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body; // Expecting { feedback: "Great work!" }

        if (!feedback) {
            return res.status(400).json({ error: 'Feedback is required' });
        }

        const result = await studentService.giveFeedback(id as string, feedback);
        return res.json(result);
    } catch (error) {
        console.error('Give feedback error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
