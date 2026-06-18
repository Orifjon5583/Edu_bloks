import crypto from 'crypto';

/**
 * Генерирует безопасные учётные данные для новых пользователей
 * Использует crypto.randomBytes для криптографически стойкой генерации
 */
export function generateSecureCredentials(prefix: string = 'user'): { login: string; password: string } {
    // Генерируем безопасный случайный login
    const loginSuffix = crypto.randomBytes(4).toString('hex'); // 8 символов hex
    const login = `${prefix}${loginSuffix}`;

    // Генерируем безопасный пароль (12 символов, base64url)
    const password = crypto.randomBytes(9)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, ''); // Убираем padding

    return { login, password };
}

/**
 * Генерирует только безопасный пароль
 */
export function generateSecurePassword(): string {
    return crypto.randomBytes(9)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
