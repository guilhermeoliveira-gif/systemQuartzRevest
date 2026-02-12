const fs = require('fs');
const dotenv = require('dotenv');

function checkFile(filename) {
    if (fs.existsSync(filename)) {
        console.log(`Checking ${filename}...`);
        const envConfig = dotenv.parse(fs.readFileSync(filename));
        const keys = Object.keys(envConfig);
        console.log(`Keys found: ${keys.join(', ')}`);
        if (keys.includes('VITE_SUPABASE_URL')) console.log('VITE_SUPABASE_URL: Present');
        else console.log('VITE_SUPABASE_URL: MISSING');

        if (keys.includes('VITE_SUPABASE_ANON_KEY')) console.log('VITE_SUPABASE_ANON_KEY: Present');
        else console.log('VITE_SUPABASE_ANON_KEY: MISSING');
    } else {
        console.log(`${filename} does not exist.`);
    }
}

checkFile('.env');
checkFile('.env.local');
