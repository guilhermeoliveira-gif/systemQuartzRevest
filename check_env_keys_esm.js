import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

function checkFile(filename) {
    if (fs.existsSync(filename)) {
        console.log(`Checking ${filename}...`);
        const envConfig = dotenv.parse(fs.readFileSync(filename));
        const keys = Object.keys(envConfig);

        const urlKey = keys.find(k => k.includes('SUPABASE_URL'));
        const anonKey = keys.find(k => k.includes('SUPABASE_ANON_KEY') || k.includes('SUPABASE_KEY'));

        console.log(`URL Key found: ${urlKey || 'NONE'}`);
        console.log(`Anon Key found: ${anonKey || 'NONE'}`);
    } else {
        console.log(`${filename} does not exist.`);
    }
}

checkFile(envPath);
checkFile(envLocalPath);
