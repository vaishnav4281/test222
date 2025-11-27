import { redis } from '../redis.js';





const VT_API_KEYS = [
    process.env.VT_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY,
    process.env.VITE_VIRUSTOTAL_API_KEY_2,
    process.env.VITE_VIRUSTOTAL_API_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (VT_API_KEYS.length === 0) return null;
    const key = VT_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % VT_API_KEYS.length;
    return key;
};

const VT_API_URL = 'https://www.virustotal.com/api/v3/domains';

export async function checkVirusTotal(domain: string) {
    const cacheKey = `vt:${domain}`;

    // Check cache first
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[VT] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[VT] Redis cache error:', err);
    }

    const apiKey = getNextKey();

    if (!apiKey) {
        console.warn('No VT_API_KEYs set');
        return null;
    }

    try {
        const [reportRes, resolutionsRes] = await Promise.allSettled([
            fetch(`${VT_API_URL}/${domain}`, {
                headers: { 'x-apikey': apiKey }
            }),
            fetch(`${VT_API_URL}/${domain}/resolutions?limit=10`, {
                headers: { 'x-apikey': apiKey }
            })
        ]);

        let data: any = {};

        if (reportRes.status === 'fulfilled' && reportRes.value.ok) {
            data = await reportRes.value.json();
        } else if (reportRes.status === 'fulfilled' && reportRes.value.status === 404) {
            // Domain not found in VT
        } else if (reportRes.status === 'fulfilled' && !reportRes.value.ok) {
            const errorText = await reportRes.value.text();
            console.warn(`[VT] API Error: ${reportRes.value.status} ${reportRes.value.statusText} - ${errorText}`);
            return { error: `VirusTotal API Error: ${reportRes.value.status} ${reportRes.value.statusText}` };
        } else {
            if (reportRes.status === 'fulfilled') {
                console.warn(`VT Report Error: ${reportRes.value.statusText}`);
            }
        }




        let resolutions: any[] = [];
        if (resolutionsRes.status === 'fulfilled') {
            if (resolutionsRes.value.ok) {
                const resData = await resolutionsRes.value.json();
                resolutions = resData.data || [];
                console.log(`[VT] Resolutions fetched: ${resolutions.length} items`);
            } else {
                const errText = await resolutionsRes.value.text();
                console.warn(`[VT] Resolutions API failed: ${resolutionsRes.value.status} ${resolutionsRes.value.statusText} - ${errText}`);
            }
        } else {
            console.warn(`[VT] Resolutions fetch rejected:`, resolutionsRes.reason);
        }

        // Return combined data
        // We attach resolutions to the main data object for convenience
        if (data.data) {
            data.resolutions = resolutions;
        } else {
            // If main report failed but resolutions worked (unlikely but possible)
            data = { data: {}, resolutions };
        }

        // Cache the result for 1 hour (3600 seconds)
        if (!data.error) {
            await redis.setex(cacheKey, 3600, JSON.stringify(data));
        }

        return data;

    } catch (error: any) {
        console.error(`[VT] Error fetching data for ${domain}:`, error.message);
        return { error: error.message };
    }
};
