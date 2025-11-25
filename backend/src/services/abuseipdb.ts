const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2/check';

export async function checkAbuseIPDB(ip: string) {
    if (!ABUSEIPDB_API_KEY) {
        console.warn('ABUSEIPDB_API_KEY not set');
        return null;
    }

    try {
        const url = new URL(ABUSEIPDB_API_URL);
        url.searchParams.append('ipAddress', ip);
        url.searchParams.append('maxAgeInDays', '90');
        url.searchParams.append('verbose', 'true');

        const response = await fetch(url.toString(), {
            headers: {
                'Key': ABUSEIPDB_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`AbuseIPDB API Error: ${response.statusText}`);
        }

        const result: any = await response.json();
        return {
            data: {
                abuseConfidenceScore: result.data?.abuseConfidenceScore || 0,
                usageType: result.data?.usageType || null,
                isp: result.data?.isp || null,
                domain: result.data?.domain || null,
                countryCode: result.data?.countryCode || null,
                isWhitelisted: result.data?.isWhitelisted || false,
                totalReports: result.data?.totalReports || 0
            }
        };
    } catch (error: any) {
        console.error('AbuseIPDB check error:', error.message);
        return null;
    }
}
