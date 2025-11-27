const IPQS_API_KEY = process.env.IPQS_API_KEY || process.env.VITE_IPQS_API_KEY;
const IPQS_API_URL = 'https://ipqualityscore.com/api/json/ip';

export async function checkIPQS(ip: string) {
    if (!IPQS_API_KEY) {
        console.warn('IPQS_API_KEY not set');
        return null;
    }

    try {
        const response = await fetch(`${IPQS_API_URL}/${IPQS_API_KEY}/${ip}`);

        if (!response.ok) {
            throw new Error(`IPQS API Error: ${response.statusText}`);
        }

        const data: any = await response.json();
        return {
            fraud_score: data.fraud_score || 0,
            vpn: data.vpn || false,
            proxy: data.proxy || false,
            tor: data.tor || false,
            country_code: data.country_code || null,
            region: data.region || null,
            city: data.city || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            ISP: data.ISP || null,
            organization: data.organization || null
        };
    } catch (error: any) {
        console.error('IPQS check error:', error.message);
        return null;
    }
}
