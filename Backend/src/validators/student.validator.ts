import { z } from 'zod';

/**
 * Schema для отправки задания (submission)
 */
export const submitAssignmentSchema = z.object({
    assignmentId: z.string()
        .uuid('Invalid assignment ID'),
    answers: z.union([
        // For Quiz
        z.array(z.object({
            questionId: z.string(),
            selectedIndex: z.number().int().min(0),
        })),
        // For Blocks
        z.object({
            sequence: z.array(z.string()),
        }),
        // Generic fallback
        z.any(),
    ]),
});

/**
 * Schema для получения задания по ID
 */
export const assignmentQuerySchema = z.object({
    assignmentId: z.string()
        .uuid('Invalid assignment ID')
        .optional(),
});
