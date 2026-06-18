import { z } from 'zod';

/**
 * Schema для создания пользователя
 */
export const createUserSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(100, 'First name is too long')
        .trim(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(100, 'Last name is too long')
        .trim(),
    login: z.string()
        .min(3, 'Login must be at least 3 characters')
        .max(50, 'Login must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Login can only contain letters, numbers, and underscores'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long'),
    role: z.preprocess(
        (val) => typeof val === 'string' ? val.toUpperCase() : val,
        z.enum(['SUPERADMIN', 'ADMIN', 'STUDENT'], {
            errorMap: () => ({ message: 'Invalid role' }),
        })
    ),
    branchId: z.string()
        .uuid('Invalid branch ID')
        .optional(),
    groupId: z.string()
        .uuid('Invalid group ID')
        .optional(),
});

/**
 * Schema для обновления пользователя
 */
export const updateUserSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(100, 'First name is too long')
        .trim()
        .optional(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(100, 'Last name is too long')
        .trim()
        .optional(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long')
        .optional(),
    branchId: z.string()
        .uuid('Invalid branch ID')
        .optional()
        .nullable(),
    groupId: z.string()
        .uuid('Invalid group ID')
        .optional()
        .nullable(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Schema для валидации ID пользователя
 */
export const userIdSchema = z.object({
    id: z.string().uuid('Invalid user ID'),
});

/**
 * Schema для фильтрации пользователей по роли
 */
export const userRoleQuerySchema = z.object({
    role: z.enum(['admin', 'student']).optional(),
});
