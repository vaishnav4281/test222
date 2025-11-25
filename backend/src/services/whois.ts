import { promises as dns } from 'dns';
import whois from 'whois-json';

import { redis } from '../redis.js';

// Simple in-memory cache (will be replaced by Redis later)
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

const TLD_WHOIS_SERVERS: Record<string, string> = {
    'com': 'whois.verisign-grs.com',
    'net': 'whois.verisign-grs.com',
    'org': 'whois.publicinterestregistry.net',
    'io': 'whois.nic.io',
    // ... add others as needed or import from a config
};

const FALLBACK_WHOIS_SERVERS = [
    'whois.iana.org',
    'whois.icann.org',
    'whois.internic.net'
];

async function queryWhoisServer(domain: string, server: string | null = null) {
    try {
        const options = server ? { server } : {};
        const result = await whois(domain, { ...options, timeout: 5000 });

        if (result && (result.registrar || result.creationDate || result.registrant)) {
            return {
                domain_name: domain,
                registrar: result.registrar || 'Unknown',
                creation_date: result.creationDate || result.registered || '',
                expiration_date: result.expirationDate || result.registryExpiryDate || '',
                updated_date: result.updatedDate || result.changed || '',
                name_servers: result.nameServer ?
                    (Array.isArray(result.nameServer) ? result.nameServer : [result.nameServer]) : [],
                status: result.domainStatus || '',
                raw: JSON.stringify(result, null, 2),
                source: server || 'default'
            };
        }
        return null;
    } catch (error: any) {
        console.warn(`WHOIS query failed for ${domain} on ${server || 'default'}:`, error.message);
        return null;
    }
}

async function resolveBestWhoisServer(domain: string) {
    try {
        const tld = domain.split('.').pop()?.toLowerCase() || '';
        const potentialServers = new Set<string>();

        if (TLD_WHOIS_SERVERS[tld]) {
            potentialServers.add(TLD_WHOIS_SERVERS[tld]);
        }

        potentialServers.add(`whois.nic.${tld}`);
        potentialServers.add(`whois.${tld}`);

        FALLBACK_WHOIS_SERVERS.forEach(server => potentialServers.add(server));

        const serverChecks = Array.from(potentialServers).map(async (server) => {
            try {
                await dns.lookup(server);
                return server;
            } catch (e) {
                return null;
            }
        });

        const results = await Promise.all(serverChecks);
        return results.find(server => server !== null) || null;

    } catch (error: any) {
        console.warn('Error finding best WHOIS server:', error.message);
        return null;
    }
}

export async function getWhois(domain: string, force = false) {
    const cacheKey = `whois:${domain.toLowerCase()}`;

    if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                ...parsed.data,
                cached: true,
                source: `cached (${parsed.source})`
            };
        }
    }

    const bestServer = await resolveBestWhoisServer(domain);
    let result = await queryWhoisServer(domain, bestServer);
    if (!result) {
        result = await queryWhoisServer(domain);
    }

    if (result) {
        await redis.set(cacheKey, JSON.stringify({
            data: result,
            source: result.source,
            timestamp: Date.now()
        }), 'EX', CACHE_TTL);
    }

    return result;
}
