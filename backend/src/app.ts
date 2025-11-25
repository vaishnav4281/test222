import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import scanRoutes from './routes/scan.js';
import apiKeyRoutes from './routes/apikeys.js';
import webhookRoutes from './routes/webhooks.js';
// import { rateLimiter } from './middleware/rateLimit.js'; // Temporarily disabled
import { metricsMiddleware } from './middleware/metrics.js';
import { apiVersion } from './middleware/versioning.js';
import { register } from './metrics.js';
import { initTelemetry } from './telemetry.js';

// Initialize OpenTelemetry
initTelemetry();

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware); // Prometheus metrics
app.use(apiVersion); // API versioning
// app.use(rateLimiter); // Global rate limiter - TEMPORARILY DISABLED FOR DEBUGGING

// V1 API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/keys', apiKeyRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Legacy routes (for backwards compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/keys', apiKeyRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: 'v1.1-no-verify' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

export default app;
