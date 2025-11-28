import rateLimit from 'express-rate-limit';
import { redis } from '../redis.js';
// import RedisStore from 'rate-limit-redis'; // TODO: Add redis store for distributed rate limiting if needed

// Standard API Rate Limiter
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' },
});

// Stricter Rate Limiter for Auth Routes
export const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/signup attempts per hour
    message: { error: 'Too many login attempts, please try again later.' }
});
