

const VT_API_KEY = process.env.VT_API_KEY;
const VT_API_URL = 'https://www.virustotal.com/api/v3/domains';

export async function checkVirusTotal(domain: string) {
    if (!VT_API_KEY) {
        console.warn('VT_API_KEY not set');
        return null;
    }

    try {
        const response = await fetch(`${VT_API_URL}/${domain}`, {
            headers: {
                'x-apikey': VT_API_KEY
            }
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`VT API Error: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.data?.attributes?.last_analysis_stats || null;
    } catch (error: any) {
        console.error('VirusTotal check error:', error.message);
        return null;
    }
}
