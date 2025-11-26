



const VT_API_KEY = process.env.VT_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY;

const VT_API_URL = 'https://www.virustotal.com/api/v3/domains';

export async function checkVirusTotal(domain: string) {
    if (!VT_API_KEY) {
        console.warn('VT_API_KEY not set');
        return null;
    }

    try {
        const [reportRes, resolutionsRes] = await Promise.allSettled([
            fetch(`${VT_API_URL}/${domain}`, {
                headers: { 'x-apikey': VT_API_KEY }
            }),
            fetch(`${VT_API_URL}/${domain}/resolutions?limit=10`, {
                headers: { 'x-apikey': VT_API_KEY }
            })
        ]);

        let data: any = {};

        if (reportRes.status === 'fulfilled' && reportRes.value.ok) {
            data = await reportRes.value.json();
        } else if (reportRes.status === 'fulfilled' && reportRes.value.status === 404) {
            // Domain not found in VT
        } else {
            if (reportRes.status === 'fulfilled') {
                console.warn(`VT Report Error: ${reportRes.value.statusText}`);
            }
        }



        let resolutions: any[] = [];
        if (resolutionsRes.status === 'fulfilled' && resolutionsRes.value.ok) {
            const resData = await resolutionsRes.value.json();
            resolutions = resData.data || [];
        }

        // Return combined data
        // We attach resolutions to the main data object for convenience
        if (data.data) {
            data.resolutions = resolutions;
        } else {
            // If main report failed but resolutions worked (unlikely but possible)
            data = { data: {}, resolutions };
        }

        return data;
    } catch (error: any) {
        console.error('VirusTotal check error:', error.message);
        return null;
    }
}

