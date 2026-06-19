import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf_token';

/**
 * CSRF Protection Middleware using Double Submit Cookie pattern
 * 
 * How it works:
 * 1. Server sets a random token in a non-httpOnly cookie (csrf_token)
 * 2. Client reads the cookie and sends it back in X-CSRF-Token header
 * 3. Server compares cookie value with header value
 * 
 * This is secure because:
 * - Attacker cannot read cookies from another domain (Same-Origin Policy)
 * - Attacker cannot set custom headers in cross-origin requests
 */

// Generate CSRF token
export function generateCsrfToken(_req: Request, res: Response, next: NextFunction): void {
    // Only generate if not present
    if (!_req.cookies[CSRF_TOKEN_COOKIE]) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_TOKEN_COOKIE, token, {
            httpOnly: false, // Must be readable by JavaScript
            secure: process.env.SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
    next();
}

// Validate CSRF token on state-changing requests
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
    // Skip for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Skip CSRF for auth endpoints (login has no prior CSRF token)
    const csrfExemptPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/generate-credentials', '/api/auth/generate-password'];
    const pathToCheck = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
    
    if (csrfExemptPaths.includes(pathToCheck) || csrfExemptPaths.some(p => pathToCheck.startsWith(p))) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_TOKEN_COOKIE];
    const headerToken = req.headers[CSRF_TOKEN_HEADER];

    if (!cookieToken || !headerToken) {
        res.status(403).json({ error: 'CSRF token missing' });
        return;
    }

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken as string))) {
        res.status(403).json({ error: 'CSRF token mismatch' });
        return;
    }

    next();
}
