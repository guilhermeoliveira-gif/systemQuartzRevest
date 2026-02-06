
import { createClient } from '@supabase/supabase-js';

// Load env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Supabase credentials missing in .env.local");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
