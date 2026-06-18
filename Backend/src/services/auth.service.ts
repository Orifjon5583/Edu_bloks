import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class AuthService {
    /**
     * Authenticate user by login and password
     */
    async login(login: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string }> {
        const user = await prisma.user.findUnique({
            where: { login },
            include: {
                group: true,
                branch: true,
            },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = password === user.password || await bcrypt.compare(password, user.password).catch(() => false);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };
    }

    /**
     * Get current user by ID
     */
    async getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                group: true,
                branch: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

export const authService = new AuthService();
