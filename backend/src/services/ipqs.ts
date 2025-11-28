const IPQS_KEYS = [
    process.env.IPQS_API_KEY,
    process.env.VITE_IPQS_API_KEY,
    process.env.VITE_IPQS_API_KEY_2,
    process.env.VITE_IPQS_API_KEY_3
].filter(Boolean) as string[];

const IPQS_API_URL = 'https://ipqualityscore.com/api/json/ip';

let currentKeyIndex = 0;

const getNextKey = () => {
    if (IPQS_KEYS.length === 0) return null;
    const key = IPQS_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % IPQS_KEYS.length;
    return key;
};

export async function checkIPQS(ip: string) {
    if (IPQS_KEYS.length === 0) {
        console.warn('No IPQS_API_KEYs set');
        return null;
    }

    console.log(`[IPQS] Checking IP: ${ip}`);

    // Try up to the number of keys we have
    for (let i = 0; i < IPQS_KEYS.length; i++) {
        const apiKey = getNextKey();
        if (!apiKey) continue;

        try {
            const url = `${IPQS_API_URL}/${apiKey}/${ip}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[IPQS] API Error (Key ${i + 1}): ${response.status} ${response.statusText}`);
                continue; // Try next key
            }

            const data: any = await response.json();

            // Check for quota error
            if (data.success === false && data.message?.includes('quota')) {
                console.warn(`[IPQS] Key ${i + 1} quota exceeded, trying next key...`);
                continue;
            }

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
            console.error(`[IPQS] Request error with key ${i + 1}:`, error.message);
        }
    }

    console.error('[IPQS] All keys failed or exhausted');
    return null;
}
