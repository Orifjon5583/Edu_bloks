import { z } from 'zod';

/**
 * Base schema для контента задания (используется как fallback)
 */
const baseContentSchema = z.record(z.any());

/**
 * Schema для Quiz контента
 */
const quizContentSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        question: z.string().min(1, 'Question text is required'),
        questionImage: z.string().optional(),
        options: z.array(z.string()).min(2, 'At least 2 options required'),
        optionImages: z.array(z.string()).optional(),
        correctIndex: z.number().int().min(0),
        points: z.number().int().min(1).default(1),
    })).min(1, 'At least one question is required'),
});

/**
 * Schema для Scratch/Python Blocks контента
 */
const blocksContentSchema = z.object({
    blocks: z.array(z.object({
        id: z.string(),
        type: z.string(),
        text: z.string(),
    })).optional(),
    solution: z.array(z.string()).optional(),
    description: z.string().optional(),
}).strict();

const tasksContentSchema = z.object({
    tasks: z.array(z.any()),
});

/**
 * Schema для создания задания
 */
export const createAssignmentSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long')
        .trim(),
    description: z.string()
        .max(2000, 'Description is too long')
        .optional(),
    type: z.enum(['QUIZ', 'SCRATCH_BLOCKS', 'PYTHON_BLOCKS'], {
        errorMap: () => ({ message: 'Invalid assignment type' }),
    }),
    dueAt: z.string()
        .datetime('Invalid date format')
        .or(z.date())
        .transform(val => typeof val === 'string' ? new Date(val) : val),
    content: z.union([quizContentSchema, tasksContentSchema, blocksContentSchema, baseContentSchema]),
    groupIds: z.array(z.string().uuid('Invalid group ID'))
        .optional(),
    studentIds: z.array(z.string().uuid('Invalid student ID'))
        .optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
}).refine(data => {
    // If status is PUBLISHED, we need at least one target (group or student)
    if (data.status === 'PUBLISHED') {
        const hasGroups = data.groupIds && data.groupIds.length > 0;
        const hasStudents = data.studentIds && data.studentIds.length > 0;
        return hasGroups || hasStudents;
    }
    return true; // DRAFT doesn't need targets
}, {
    message: 'At least one group or student is required for PUBLISHED assignment',
    path: ['status'] // attach error to status
});

/**
 * Schema для обновления задания
 */
export const updateAssignmentSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long')
        .trim()
        .optional(),
    description: z.string()
        .max(2000, 'Description is too long')
        .optional()
        .nullable(),
    dueAt: z.string()
        .datetime('Invalid date format')
        .or(z.date())
        .transform(val => typeof val === 'string' ? new Date(val) : val)
        .optional(),
    content: z.union([quizContentSchema, tasksContentSchema, blocksContentSchema, baseContentSchema])
        .optional(),
    groupIds: z.array(z.string().uuid()).optional(),
    studentIds: z.array(z.string().uuid()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Schema для публикации задания
 */
export const publishAssignmentSchema = z.object({
    groupIds: z.array(z.string().uuid('Invalid group ID')).optional(),
    studentIds: z.array(z.string().uuid('Invalid student ID')).optional(),
}).refine(data => {
    const hasGroups = data.groupIds && data.groupIds.length > 0;
    const hasStudents = data.studentIds && data.studentIds.length > 0;
    return hasGroups || hasStudents;
}, {
    message: 'At least one group or student is required',
    path: ['groupIds'] // generic path error
});

/**
 * Schema для валидации ID задания
 */
export const assignmentIdSchema = z.object({
    id: z.string().uuid('Invalid assignment ID'),
});
