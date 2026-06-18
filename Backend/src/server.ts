import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes

import authRoutes from './routes/auth.routes';
import branchRoutes from './routes/branch.routes';
import groupRoutes from './routes/group.routes';
import userRoutes from './routes/user.routes';
import assignmentRoutes from './routes/assignment.routes';
import studentRoutes from './routes/student.routes';
import statsRoutes from './routes/stats.routes';
import gamificationRoutes from './routes/gamification.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { generateCsrfToken, validateCsrfToken } from './middleware/csrf.middleware';

// Import singleton Prisma
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// HTTP request logging
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => logger.http(message.trim()),
    },
}));

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Relaced limit for development
    message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Relaxed limit for development
    message: 'Слишком много запросов. Попробуйте позже.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for SPA - frontend handles CSP
    crossOriginEmbedderPolicy: false, // Allow loading external resources
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply rate limiting
app.use('/api', apiLimiter); // Global API rate limit
app.use('/api/auth/login', loginLimiter); // Stricter limit for login

// CSRF Protection
app.use('/api', generateCsrfToken); // Set CSRF token cookie
app.use('/api', validateCsrfToken); // Validate on state-changing requests

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api', statsRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
