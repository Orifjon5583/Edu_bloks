import { z } from 'zod';

/**
 * Schema для создания филиала
 */
export const createBranchSchema = z.object({
    name: z.string()
        .min(1, 'Branch name is required')
        .max(200, 'Branch name is too long')
        .trim(),
    address: z.string()
        .max(500, 'Address is too long')
        .trim()
        .optional(),
});

/**
 * Schema для обновления филиала
 */
export const updateBranchSchema = z.object({
    name: z.string()
        .min(1, 'Branch name is required')
        .max(200, 'Branch name is too long')
        .trim()
        .optional(),
    address: z.string()
        .max(500, 'Address is too long')
        .trim()
        .optional()
        .nullable(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

/**
 * Schema для валидации ID филиала
 */
export const branchIdSchema = z.object({
    id: z.string().uuid('Invalid branch ID'),
});
