import { z } from 'zod';

/**
 * Schema для валидации входа в систему
 */
export const loginSchema = z.object({
    login: z.string()
        .min(1, 'Login is required')
        .max(50, 'Login must be at most 50 characters'),
    password: z.string()
        .min(1, 'Password is required')
        .max(100, 'Password is too long'),
});

/**
 * Schema для генерации учётных данных
 */
export const generateCredentialsSchema = z.object({
    role: z.enum(['ADMIN', 'STUDENT'], {
        errorMap: () => ({ message: 'Role must be either ADMIN or STUDENT' }),
    }),
});
