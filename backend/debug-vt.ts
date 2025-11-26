
import 'dotenv/config';
import { checkVirusTotal } from './src/services/vt';

async function main() {
    console.log('Testing VirusTotal API...');
    const result = await checkVirusTotal('google.com');
    console.log('Result:', JSON.stringify(result, null, 2));
}

main();
