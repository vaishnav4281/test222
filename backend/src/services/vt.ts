



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

        return data;

    } catch (error: any) {
        console.error(`[VT] Error fetching data for ${domain}:`, error.message);
        return { error: error.message };
    }
};
