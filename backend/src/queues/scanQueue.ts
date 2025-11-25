// @ts-ignore
import { Queue, Worker } from 'bullmq';
import { redis } from '../redis.js';
import { checkDnsbl } from '../services/dnsbl.js';
import { getWhois } from '../services/whois.js';
import { checkVirusTotal } from '../services/vt.js';
import { prisma } from '../app.js';

export const scanQueue = new Queue('scan-queue', { connection: redis });

const worker = new Worker('scan-queue', async (job: any) => {
    const { target, userId, scanId } = job.data;
    console.log(`Processing scan for ${target} (Job ${job.id})`);

    try {
        // Run all checks in parallel
        const [dnsbl, whois, vt] = await Promise.all([
            checkDnsbl(target), // Assuming target is IP for DNSBL, or resolve it
            getWhois(target),
            checkVirusTotal(target)
        ]);

        const result = {
            dnsbl,
            whois,
            vt,
            timestamp: new Date().toISOString()
        };

        // Update scan history with result
        if (scanId) {
            await prisma.scanHistory.update({
                where: { id: scanId },
                data: { result }
            });
        }

        return result;
    } catch (error: any) {
        console.error(`Scan failed for ${target}:`, error);
        throw error;
    }
}, { connection: redis });

worker.on('completed', (job: any) => {
    console.log(`Scan job ${job.id} completed`);
});

worker.on('failed', (job: any, err: any) => {
    console.error(`Scan job ${job?.id} failed:`, err);
});
