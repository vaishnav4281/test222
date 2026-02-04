import { redis } from '../redis.js';
import { promises as dns } from 'dns';

const SHODAN_API_KEY = process.env.SHODAN_API_KEY;
const SHODAN_API_URL = 'https://api.shodan.io';

export async function checkShodan(domain: string) {
    // Shodan works best with IP addresses. Let's resolve the domain first.
    let ip = domain;
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain);

    if (!isIp) {
        try {
            const ips = await dns.resolve4(domain);
            if (ips && ips.length > 0) {
                ip = ips[0]!;
            } else {
                // If A record fails, try to return error or maybe Shodan has a search endpoint we can fall back to?
                // For now, let's treat it as not found.
                return { error: 'Could not resolve domain to IP for Shodan scan.' };
            }
        } catch (e) {
            return { error: 'DNS resolution failed for Shodan scan.' };
        }
    }

    const cacheKey = `shodan:${ip}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Shodan] Returning cached result for ${ip}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Shodan] Redis cache error:', err);
    }

    if (!SHODAN_API_KEY) {
        console.warn('No SHODAN_API_KEY set');
        // Return a specific structure so frontend knows it's not configured
        return { error: 'Shodan API key not configured on server.' };
    }

    try {
        // Shodan Host Information
        // https://api.shodan.io/shodan/host/{ip}?key={YOUR_API_KEY}
        const response = await fetch(`${SHODAN_API_URL}/shodan/host/${ip}?key=${SHODAN_API_KEY}`);

        if (response.status === 404) {
            return { message: 'No information found for this host in Shodan.' };
        }

        if (response.status === 401) {
            return { error: 'Invalid Shodan API Key.' };
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[Shodan] API Error: ${response.status} - ${errorText}`);
            return { error: `Shodan API Error: ${response.status}` };
        }

        const data = await response.json();

        // Cache result for 24 hours (86400 seconds)
        await redis.setex(cacheKey, 86400, JSON.stringify(data));

        return data;

    } catch (error: any) {
        console.error(`[Shodan] Error fetching data for ${ip}:`, error.message);
        return { error: 'Failed to fetch data from Shodan.' };
    }
}
