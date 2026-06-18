import { z } from 'zod';

/**
 * Schema для создания группы
 */
export const createGroupSchema = z.object({
    name: z.string()
        .min(1, 'Group name is required')
        .max(200, 'Group name is too long')
        .trim(),
    teacherId: z.string()
        .uuid('Invalid teacher ID'),
    branchId: z.string()
        .uuid('Invalid branch ID')
        .optional(),
});

/**
 * Schema для обновления группы
 */
export const updateGroupSchema = z.object({
    name: z.string()
        .min(1, 'Group name is required')
        .max(200, 'Group name is too long')
        .trim()
        .optional(),
    teacherId: z.string()
        .uuid('Invalid teacher ID')
        .optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Schema для валидации ID группы
 */
export const groupIdSchema = z.object({
    id: z.string().uuid('Invalid group ID'),
});
