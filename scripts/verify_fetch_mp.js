
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    try {
        console.log('Fetching materias_primas...');
        const { data, error } = await supabase
            .from('materia_prima')
            .select('*')
            .limit(5);

        if (error) {
            console.error('Error fetching:', error);
        } else {
            console.log('Success! Data length:', data.length);
            console.log('Sample item:', data[0]);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testFetch();
