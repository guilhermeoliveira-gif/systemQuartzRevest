
import { createClient } from '@supabase/supabase-js';

// Load env vars
// Load env vars with fallback for Node.js environment (scripts)
// Load env vars with fallback for Node.js environment (scripts)
let supabaseUrl = '';
let supabaseKey = '';

// Check for Vite environment (client-side) - explicit access required for static replacement
if (typeof import.meta !== 'undefined' && import.meta.env) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// Fallback to Node environment (scripts) if not found in Vite env
if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
}

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials missing. Check .env.local or environment variables.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'quartz_revest_auth',
        // @ts-ignore - Propriedade necessária para resolver o erro de navigatorLock timeout
        lockSession: false
    }
} as any);
