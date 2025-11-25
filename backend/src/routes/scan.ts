import express from 'express';
import { checkDnsbl } from '../services/dnsbl.js';
import { getWhois } from '../services/whois.js';
import { checkVirusTotal } from '../services/vt.js';
import { scanQueue } from '../queues/scanQueue.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../app.js';

const router = express.Router();

router.get('/dnsbl', async (req, res) => {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'Missing IP parameter' });
    }
    const result = await checkDnsbl(ip);
    res.json(result);
});

router.get('/whois', async (req, res) => {
    const { domain, force } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await getWhois(domain, force === 'true');
    if (!result) return res.status(404).json({ error: 'WHOIS not found' });
    res.json(result);
});

router.get('/vt', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await checkVirusTotal(domain);
    res.json({ stats: result });
});

router.post('/full', authenticateToken, async (req: AuthRequest, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Target required' });

    try {
        // Create a placeholder history entry
        const scan = await prisma.scanHistory.create({
            data: {
                userId: req.user.userId,
                target,
                result: { status: 'pending' }
            }
        });

        // Add to queue
        await scanQueue.add('full-scan', {
            target,
            userId: req.user.userId,
            scanId: scan.id
        });

        res.json({ message: 'Scan started', scanId: scan.id });
    } catch (error) {
        console.error('Full scan error:', error);
        res.status(500).json({ error: 'Failed to start scan' });
    }
});

export default router;
