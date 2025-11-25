import type { Request, Response, NextFunction } from 'express';
import { redis } from '../redis.js';

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_WINDOW_REQUEST_COUNT = 100; // 100 requests per minute
const WINDOW_LOG_INTERVAL_IN_SECONDS = 1;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ip = req.ip || 'unknown';
        const key = `ratelimit:${ip}`;

        const currentRequestCount = await redis.incr(key);

        if (currentRequestCount === 1) {
            await redis.expire(key, WINDOW_SIZE_IN_SECONDS);
        }

        if (currentRequestCount > MAX_WINDOW_REQUEST_COUNT) {
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }

        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        next(); // Fail open
    }
};
