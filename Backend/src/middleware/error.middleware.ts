import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    if (err.name === 'ValidationError') {
        res.status(400).json({ error: 'Validation error', details: err.message });
        return;
    }

    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    res.status(500).json({ error: 'Internal server error' });
};
