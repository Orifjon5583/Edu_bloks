import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, generateCredentialsSchema } from '../validators/auth.validator';
import { authService } from '../services/auth.service';

const router = Router();

// Login
router.post('/login', validateBody(loginSchema), async (req, res) => {
    try {
        const { login, password } = req.body;
        const result = await authService.login(login, password);

        // Set token in httpOnly cookie
        res.cookie('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.json({ user: result.user });
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout
router.post('/logout', (_req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.SECURE_COOKIES === 'true',
        sameSite: 'lax',
    });
    return res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        // Read token from httpOnly cookie (same as authenticate middleware)
        const token = req.cookies?.auth_token;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };

        const user = await authService.getCurrentUser(decoded.userId);
        return res.json(user);
    } catch (error: any) {
        console.error('Get user error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// Generate credentials (for creating users)
router.post('/generate-credentials', validateBody(generateCredentialsSchema), async (req, res) => {
    try {
        const { role } = req.body;

        // Validate role
        if (!role || !['ADMIN', 'STUDENT'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be ADMIN or STUDENT' });
        }

        const { generateSecureCredentials } = await import('../utils/credentials');
        const prefix = role === 'ADMIN' ? 'teacher' : 'student';
        const credentials = generateSecureCredentials(prefix);

        return res.json(credentials);
    } catch (error) {
        console.error('Generate credentials error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate password only (for password resets)
router.post('/generate-password', async (_req, res) => {
    try {
        const { generateSecurePassword } = await import('../utils/credentials');
        const password = generateSecurePassword();

        return res.json({ password });
    } catch (error) {
        console.error('Generate password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
